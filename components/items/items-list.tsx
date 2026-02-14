'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { ItemCard } from './item-card';
import { Item } from '@/types';

interface ItemsListProps {
  initialItems: Item[];
  currentUser: {
    id: string;
    hostel_type: 'boys' | 'girls';
  };
}

export function ItemsList({ initialItems, currentUser }: ItemsListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const supabase = createClient();

  const handleItemDeleted = (deletedItemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== deletedItemId));
  };

  const fetchItems = async () => {
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          seller:profiles(name, room_number, hostel_name, avatar_url)
        `)
        .eq('status', 'available')
        .or(`hostel_visible_to.eq.both,hostel_visible_to.eq.${currentUser.hostel_type}`);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Apply condition filter
      if (conditionFilter !== 'all') {
        query = query.eq('condition', conditionFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchQuery, categoryFilter, conditionFilter]);

  const categories = [
    'all',
    'electronics',
    'books',
    'clothing',
    'furniture',
    'sports',
    'food',
    'other'
  ];

  const conditions = ['all', 'new', 'like_new', 'good', 'fair'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition === 'all' ? 'All Conditions' : condition.replace('_', ' ').charAt(0).toUpperCase() + condition.replace('_', ' ').slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add New Item Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Available Items</h2>
        <Link href="/dashboard/items/new">
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            List New Item
          </Button>
        </Link>
      </div>

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              onDelete={handleItemDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all' || conditionFilter !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Be the first to list an item!'}
          </p>
          <Link href="/dashboard/items/new">
            <Button>List New Item</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
