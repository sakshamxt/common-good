// src/components/listings/ListingFilters.jsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Slider } from "@/components/ui/slider"; // Keep if you plan to use it
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const exampleCategories = ["Technology", "Education", "Home & Garden", "Arts & Crafts", "Services", "Apparel", "Electronics", "Furniture", "Other"];
const exampleListingTypes = ['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'];
const exampleSortOptions = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "title", label: "Title (A-Z)" },
  { value: "-title", label: "Title (Z-A)" },
];

const ALL_ITEMS_SENTINEL = "__ALL__"; // Special value for "All" options

const ListingFilters = ({ initialFilters = {}, onApplyFilters, onClearFilters }) => {
  const [filters, setFilters] = useState({
    category: initialFilters.category || "",
    listingType: initialFilters.listingType || "",
    location: initialFilters.location || "",
    tags: initialFilters.tags || "",
    sort: initialFilters.sort || "-createdAt",
  });

  useEffect(() => {
    setFilters(prev => ({
        ...prev,
        category: initialFilters.category || "",
        listingType: initialFilters.listingType || "",
        location: initialFilters.location || "",
        tags: initialFilters.tags || "",
        sort: initialFilters.sort || "-createdAt",
    }));
  }, [initialFilters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    // If the selected value is our sentinel, treat it as clearing the filter (set to empty string)
    const actualValue = value === ALL_ITEMS_SENTINEL ? "" : value;
    setFilters(prev => ({ ...prev, [name]: actualValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitFilters = {
      ...filters,
      tags: filters.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(','),
    };
    onApplyFilters(submitFilters);
  };
  
  const handleClear = () => {
    const cleared = { category: "", listingType: "", location: "", tags: "", sort: "-createdAt" };
    setFilters(cleared);
    if(onClearFilters) onClearFilters(cleared);
    else onApplyFilters(cleared);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-0">
      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          name="category"
          // When filters.category is "", SelectValue will show placeholder
          value={filters.category || ALL_ITEMS_SENTINEL} // Use sentinel if filter is empty, so "All Categories" is selected
          onValueChange={(value) => handleSelectChange('category', value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ITEMS_SENTINEL}>All Categories</SelectItem> {/* Corrected: Use sentinel */}
            {exampleCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="listingType">Listing Type</Label>
        <Select
          name="listingType"
          value={filters.listingType || ALL_ITEMS_SENTINEL} // Use sentinel if filter is empty
          onValueChange={(value) => handleSelectChange('listingType', value)}
        >
          <SelectTrigger id="listingType">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ITEMS_SENTINEL}>All Types</SelectItem> {/* Corrected: Use sentinel */}
            {exampleListingTypes.map(type => (
              <SelectItem key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location (e.g., City or Zip)</Label>
        <Input
          id="location"
          name="location"
          placeholder="Near..."
          value={filters.location}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="e.g., handmade, tutorial"
          value={filters.tags}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <Label htmlFor="sort">Sort By</Label>
        <Select
          name="sort"
          value={filters.sort} // Sort usually has a default, so no "All" option needed typically
          onValueChange={(value) => handleSelectChange('sort', value)}
        >
          <SelectTrigger id="sort"><SelectValue placeholder="Sort by..." /></SelectTrigger>
          <SelectContent>
            {exampleSortOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" className="flex-1">Apply Filters</Button>
        <Button type="button" variant="outline" onClick={handleClear} className="flex-1">Clear Filters</Button>
      </div>
    </form>
  );
};

export default ListingFilters;