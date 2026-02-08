// lib/matching.ts
import { createClient } from '@/lib/supabase/client'

export interface MatchResult {
  type: 'item_matches_request' | 'request_matches_item'
  itemId?: string
  requestId?: string
  matchedWith: {
    id: string
    title: string
    ownerName: string
    ownerEmail?: string
  }
}

export class MatchingService {
  private supabase = createClient()

  async checkForMatches(newItem: any) {
    const matches: MatchResult[] = []
    
    // Find requests that match this item
    const { data: matchingRequests } = await this.supabase
      .from('requests')
      .select('*')
      .eq('status', 'open')
      .ilike('title', `%${this.extractKeywords(newItem.title)}%`)
      .limit(5)

    if (matchingRequests) {
      for (const request of matchingRequests) {
        const similarity = this.calculateSimilarity(newItem.title, request.title)
        if (similarity > 0.3) { // 30% similarity threshold
          matches.push({
            type: 'item_matches_request',
            itemId: newItem.id,
            matchedWith: {
              id: request.id,
              title: request.title,
              ownerName: request.requester?.name || 'Someone',
              ownerEmail: request.requester?.email
            }
          })
        }
      }
    }

    return matches
  }

  async checkForRequestMatches(newRequest: any) {
    const matches: MatchResult[] = []
    
    // Find items that match this request
    const { data: matchingItems } = await this.supabase
      .from('items')
      .select('*')
      .eq('status', 'available')
      .ilike('title', `%${this.extractKeywords(newRequest.title)}%`)
      .limit(5)

    if (matchingItems) {
      for (const item of matchingItems) {
        const similarity = this.calculateSimilarity(newRequest.title, item.title)
        if (similarity > 0.3) { // 30% similarity threshold
          matches.push({
            type: 'request_matches_item',
            requestId: newRequest.id,
            matchedWith: {
              id: item.id,
              title: item.title,
              ownerName: item.seller?.name || 'Someone',
              ownerEmail: item.seller?.email
            }
          })
        }
      }
    }

    return matches
  }

  async createNotification(match: MatchResult, userId: string) {
    let title, message, linkUrl

    if (match.type === 'item_matches_request') {
      title = '🎯 Item Found Matching Your Request!'
      message = `Someone just posted "${match.matchedWith.title}" which matches your request.`
      linkUrl = `/dashboard/items/${match.itemId}`
    } else {
      title = '🎯 Request for Your Item!'
      message = `Someone is looking for "${match.matchedWith.title}" which matches your item.`
      linkUrl = `/dashboard/requests/${match.requestId}`
    }

    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: 'match',
        link_url: linkUrl,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to create notification:', error)
    }
  }

  private extractKeywords(title: string): string {
    // Extract meaningful keywords from title
    return title
      .toLowerCase()
      .replace(/\b(for|sale|wanted|need|looking)\b/g, '')
      .trim()
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()
    const longer = s1.length > s2.length ? s1 : s2
    const shorter = s1.length > s2.length ? s2 : s1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}
