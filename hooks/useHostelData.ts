// hooks/useHostelData.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { filterByHostelType, canViewContent } from '@/lib/utils/hostel-separation'

const supabase = createClient()

export function useHostelBusinesses(userHostelType: 'boys' | 'girls') {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        // Filter businesses based on hostel type
        const filteredBusinesses = filterByHostelType(data || [], userHostelType)
        setBusinesses(filteredBusinesses)
      } catch (error) {
        console.error('Error fetching businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userHostelType])

  return { businesses, loading }
}

export function useHostelProducts(userHostelType: 'boys' | 'girls') {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get businesses first to find owner hostel types
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, hostel_type, owner_id')

        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        // Add owner hostel type to each product
        const productsWithHostelType = (products || []).map(product => {
          const business = businesses?.find(b => b.owner_id === product.owner_id)
          return {
            ...product,
            owner_hostel_type: business?.hostel_type
          }
        })

        // Filter products based on hostel type
        const filteredProducts = filterByHostelType(productsWithHostelType, userHostelType)
        setProducts(filteredProducts)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [userHostelType])

  return { products, loading }
}

export function useHostelRequests(userHostelType: 'boys' | 'girls') {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Get user profiles to determine hostel types
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, hostel_type')

        const { data: requests } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })

        // Add requester hostel type to each request
        const requestsWithHostelType = (requests || []).map(request => {
          const profile = profiles?.find(p => p.id === request.requester_id)
          return {
            ...request,
            hostel_type: profile?.hostel_type
          }
        })

        // Filter requests based on hostel type
        const filteredRequests = filterByHostelType(requestsWithHostelType, userHostelType)
        setRequests(filteredRequests)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [userHostelType])

  return { requests, loading }
}

export function useHostelSales(userHostelType: 'boys' | 'girls') {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSales = async () => {
      try {
        // Get businesses to find owner hostel types
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, hostel_type, owner_id')

        const { data: sales } = await supabase
          .from('items')
          .select('*')
          .eq('status', 'available')
          .order('created_at', { ascending: false })

        // Add seller hostel type to each sale item
        const salesWithHostelType = (sales || []).map(sale => {
          const business = businesses?.find(b => b.owner_id === sale.seller_id)
          return {
            ...sale,
            hostel_type: business?.hostel_type
          }
        })

        // Filter sales based on hostel type
        const filteredSales = filterByHostelType(salesWithHostelType, userHostelType)
        setSales(filteredSales)
      } catch (error) {
        console.error('Error fetching sales:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSales()
  }, [userHostelType])

  return { sales, loading }
}
