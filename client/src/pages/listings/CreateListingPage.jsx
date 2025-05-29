// src/pages/listings/CreateListingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingFormSchema } from '@/utils/schemas';
import { useMutation } from '@tanstack/react-query';
import { createListing } from '@/api/listingService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { X } from 'lucide-react';

const listingTypes = ['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'];
// Example categories - you might fetch these or have a more robust system
const categories = ["Technology", "Education", "Home & Garden", "Arts & Crafts", "Services", "Apparel", "Electronics", "Furniture", "Other"];

// Maximum number of files allowed for upload
const MAX_TOTAL_FILES = 5;


const CreateListingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // To pass user's default location/coords if needed
  const [imagePreviews, setImagePreviews] = useState([]);

  const form = useForm({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      listingType: undefined,
      title: "",
      description: "",
      category: "",
      tags: "", // Will be submitted as comma-separated, schema transforms to array
      photos: [],
      estimatedEffort: "",
      exchangePreference: "",
      location: user?.location || "", // Pre-fill if user has location
      longitude: user?.coordinates?.coordinates?.[0]?.toString() || "",
      latitude: user?.coordinates?.coordinates?.[1]?.toString() || "",
    },
  });

  const { mutate: submitCreateListing, isLoading } = useMutation({
    mutationFn: createListing,
    onSuccess: (data) => {
      toast.success('Listing created successfully!');
      navigate(`/listings/${data.listing._id}`); // Navigate to the new listing's detail page
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Failed to create listing.";
      const errorDetails = error.response?.data?.details;
      if (errorDetails && Array.isArray(errorDetails)) {
        errorDetails.forEach(detail => toast.error(`${detail.field ? detail.field + ': ' : ''}${detail.message}`));
      } else {
        toast.error(errorMsg);
      }
      console.error("Create listing error:", error.response?.data || error);
    },
  });

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files);
    // Zod schema expects array of files, RHF will handle FileList
    form.setValue('photos', files, { shouldValidate: true });

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };
  
  // Cleanup object URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);


  const onSubmit = (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'photos' && data.photos) {
        data.photos.forEach(photoFile => {
          formData.append('photos', photoFile); // Append each file
        });
      } else if (key === 'tags' && Array.isArray(data.tags)) {
         // The schema already transforms string to array, but if it's direct input
         // Or if we are sending it as a comma-separated string
         // Backend expects array of strings for tags in the model.
         // If schema transforms 'tags' input string to array for validation,
         // we need to ensure it's correctly appended.
         // Let's assume data.tags is already the array of strings from schema transform
        data.tags.forEach(tag => formData.append('tags[]', tag)); // Send as array
      } else if (key === 'longitude' || key === 'latitude') {
        // Only append coordinates if both are provided and valid numbers
        if (data.longitude && data.latitude && !isNaN(parseFloat(data.longitude)) && !isNaN(parseFloat(data.latitude))) {
            // The backend expects coordinates as an object { type: 'Point', coordinates: [lon, lat] }
            // For FormData, we might need to send them as separate fields or stringified JSON
            // Let's send as separate fields, backend Listing controller handles this construction
            formData.append('coordinates[0]', data.longitude); // lon
            formData.append('coordinates[1]', data.latitude);  // lat
        }
      } else if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    
    // Remove individual longitude/latitude if coordinates are being sent as an array/object
    // The current logic sends them as coordinates[0] and coordinates[1] if valid.

    submitCreateListing(formData);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Create New Listing</CardTitle>
          <CardDescription>Share your skills or items with the community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="listingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {listingTypes.map(type => (
                          <SelectItem key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl><Input placeholder="e.g., Guitar Lessons, Handcrafted Scarf" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description*</FormLabel>
                    <FormControl><Textarea placeholder="Detailed description of your offer or request..." {...field} rows={5} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl><Input placeholder="e.g., music, beginner, handmade (comma-separated)" {...field} /></FormControl>
                    <FormDescription>Comma-separated values (e.g., coding, javascript, webdev).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Photos (Up to {MAX_TOTAL_FILES})</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </FormControl>
                {form.formState.errors.photos && <FormMessage>{form.formState.errors.photos.message || form.formState.errors.photos.root?.message}</FormMessage>}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {imagePreviews.map((previewUrl, index) => (
                      <div key={index} className="relative">
                        <img src={previewUrl} alt={`Preview ${index + 1}`} className="rounded-md object-cover h-32 w-full" />
                        {/* Optional: Add button to remove individual previewed images before submit */}
                      </div>
                    ))}
                  </div>
                )}
              </FormItem>

              <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location* (e.g., City, Neighborhood)</FormLabel>
                    <FormControl><Input placeholder="Your general location for the exchange" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="longitude" render={({ field }) => (
                    <FormItem> <FormLabel>Longitude (Optional)</FormLabel> <FormControl><Input type="number" step="any" placeholder="-73.985130" {...field} /></FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={form.control} name="latitude" render={({ field }) => (
                    <FormItem> <FormLabel>Latitude (Optional)</FormLabel> <FormControl><Input type="number" step="any" placeholder="40.748817" {...field} /></FormControl> <FormMessage /> </FormItem>
                )} />
              </div>
               <FormDescription className="text-xs">Providing coordinates will help users find your listing on a map. If not provided, your profile location may be used if available.</FormDescription>


              <FormField control={form.control} name="estimatedEffort" render={({ field }) => (
                  <FormItem> <FormLabel>Estimated Effort/Value (Optional)</FormLabel> <FormControl><Input placeholder="e.g., 2 hours, Approx $20 value" {...field} /></FormControl> <FormMessage /> </FormItem>
                )}
              />
              <FormField control={form.control} name="exchangePreference" render={({ field }) => (
                  <FormItem> <FormLabel>Exchange Preference (Optional)</FormLabel> <FormControl><Input placeholder="e.g., Skill for Skill, Item for Service" {...field} /></FormControl> <FormMessage /> </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner size={20} /> : 'Create Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateListingPage;