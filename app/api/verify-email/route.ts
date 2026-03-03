import { NextRequest, NextResponse } from 'next/server'

// Using Abstract API for email validation (free tier available)
// You can also use ZeroBounce, Hunter.io, or Mailboxlayer
const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Email verification request for:', email)
    console.log('API key available:', !!ABSTRACT_API_KEY)
    console.log('API key length:', ABSTRACT_API_KEY?.length)

    // Basic format validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid email format',
          details: { format_valid: false }
        },
        { status: 200 }
      )
    }

    // If API key is configured, use Abstract API
    if (ABSTRACT_API_KEY && ABSTRACT_API_KEY.length > 10) {
      console.log('Using Abstract API for email verification')
      console.log('API key (first 4 chars):', ABSTRACT_API_KEY.substring(0, 4) + '...')
      console.log('API key (last 4 chars):', '...' + ABSTRACT_API_KEY.slice(-4))
      try {
        const response = await fetch(
          `https://emailreputation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
        )

        if (!response.ok) {
          console.error('Abstract API error:', response.status, response.statusText)
          let message = 'Email format is valid (API service unavailable)'
          
          if (response.status === 401) {
            message = 'Email format is valid (API key invalid - check configuration)'
          } else if (response.status === 429) {
            message = 'Email format is valid (API rate limit exceeded)'
          }
          
          // Fall back to basic validation if API fails
          return NextResponse.json({
            valid: true,
            details: { format_valid: true, api_used: false, api_error: true, status: response.status },
            message
          })
        }

        const apiData = await response.json()
        console.log('Abstract API response:', apiData)

      // Abstract API response structure:
      // email_deliverability.status: "deliverable", "undeliverable", "risky", "unknown"
      // email_deliverability.is_format_valid: boolean
      // email_deliverability.is_smtp_valid: boolean
      // email_deliverability.is_mx_valid: boolean
      // email_quality.is_disposable: boolean
      // email_quality.is_free_email: boolean

      const isValid = 
        apiData.email_deliverability?.is_format_valid === true &&
        apiData.email_deliverability?.status === 'deliverable' &&
        apiData.email_quality?.is_disposable === false

      return NextResponse.json({
        valid: isValid,
        details: {
          format_valid: apiData.email_deliverability?.is_format_valid,
          deliverability: apiData.email_deliverability?.status,
          smtp_valid: apiData.email_deliverability?.is_smtp_valid,
          mx_valid: apiData.email_deliverability?.is_mx_valid,
          is_disposable: apiData.email_quality?.is_disposable,
          is_free: apiData.email_quality?.is_free_email,
          score: apiData.email_quality?.score
        },
        message: isValid 
          ? 'Email is valid and deliverable' 
          : apiData.email_quality?.is_disposable 
            ? 'Disposable emails are not allowed'
            : apiData.email_deliverability?.status === 'undeliverable'
              ? 'Email address does not exist'
              : 'Email verification failed'
      })
      } catch (apiError) {
        console.error('Abstract API error:', apiError)
        // Fall back to basic validation
        return NextResponse.json({
          valid: true,
          details: { format_valid: true, api_used: false, api_error: true },
          message: 'Email format is valid (API service error)'
        })
      }
    }

    // Fallback: Basic verification without external API
    // Check for common disposable email domains
    const disposableDomains = [
      'tempmail.com', 'throwaway.com', 'mailinator.com', 
      'guerrillamail.com', '10minutemail.com', 'fakeemail.com'
    ]
    
    const domain = email.split('@')[1]?.toLowerCase()
    const isDisposable = disposableDomains.some(d => domain?.includes(d))
    
    if (isDisposable) {
      return NextResponse.json({
        valid: false,
        details: { format_valid: true, is_disposable: true },
        message: 'Disposable emails are not allowed'
      })
    }

    return NextResponse.json({
      valid: true,
      details: { format_valid: true, api_used: false },
      message: 'Email format is valid (advanced verification not configured)'
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Failed to verify email',
        message: 'Email verification service is temporarily unavailable'
      },
      { status: 500 }
    )
  }
}
