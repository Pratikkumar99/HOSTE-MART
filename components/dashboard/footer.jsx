'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="w-full bg-black text-white mt-auto border-t border-gray-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold">DormACe </span>
            </div>
            <p className="text-gray-400 text-sm">
              Your one-stop marketplace for hostel essentials and more. Buy, sell, and request items within your hostel community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">Home</Link></li>
              <li><Link href="/dashboard/items" className="text-gray-400 hover:text-white transition-colors text-sm">Sell Items</Link></li>
              <li><Link href="/dashboard/requests" className="text-gray-400 hover:text-white transition-colors text-sm">Requests</Link></li>
              <li><Link href="/dashboard/chat" className="text-gray-400 hover:text-white transition-colors text-sm">Messages</Link></li>
              <li><Link href="/dashboard/profile" className="text-gray-400 hover:text-white transition-colors text-sm">My Profile</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard/items?category=books" className="text-gray-400 hover:text-white transition-colors text-sm">Books</Link></li>
              <li><Link href="/dashboard/items?category=electronics" className="text-gray-400 hover:text-white transition-colors text-sm">Electronics</Link></li>
              <li><Link href="/dashboard/items?category=furniture" className="text-gray-400 hover:text-white transition-colors text-sm">Furniture</Link></li>
              <li><Link href="/dashboard/items?category=clothing" className="text-gray-400 hover:text-white transition-colors text-sm">Clothing</Link></li>
              <li><Link href="/dashboard/items?category=other" className="text-gray-400 hover:text-white transition-colors text-sm">Other</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a href="mailto:support@hostelmart.com" className="text-gray-400 hover:text-white transition-colors text-sm">support@hostelmart.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a href="tel:+911234567890" className="text-gray-400 hover:text-white transition-colors text-sm">+91 12345 67890</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            {currentYear} DormACe . All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link> */}
          </div>
        </div>
      </div>
    </footer>
  )
}