// src/pages/listings/EditListingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateListingFormSchema } from '@/utils/schemas'; // Use the update schema
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getListingById, updateListing } from '@/api/listingService';
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
import { X, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox'; // For deleting photos


const MAX_TOTAL_FILES = 5; // Maximum number of photos allowed (adjust as needed)
const listingTypes = ['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'];
const categories = ["Technology", "Education", "Home & Garden", "Arts & Crafts", "Services", "Apparel", "Electronics", "Furniture", "Other"];

const EditListingPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // For new photos
  const [photosToDelete, setPhotosToDelete] = useState([]); // Array of public_ids

  const { data: listingData, isLoading: isLoadingListing, error: fetchError } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId,
    onSuccess: (data) => {
      if (data?.listing) {
        const listing = data.listing;
        // Pre-fill form
        form.reset({
          listingType: listing.listingType,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          tags: Array.isArray(listing.tags) ? listing.tags.join(', ') : '',
          // photos field is for NEW uploads
          estimatedEffort: listing.estimatedEffort || "",
          exchangePreference: listing.exchangePreference || "",
          location: listing.location,
          longitude: listing.coordinates?.coordinates?.[0]?.toString() || "",
          latitude: listing.coordinates?.coordinates?.[1]?.toString() || "",
          status: listing.status,
        });
        setExistingPhotos(listing.photos || []);
      }
    }
  });
  
  const form = useForm({
    resolver: zodResolver(updateListingFormSchema), // Use update schema
    // Default values are set by form.reset in onSuccess of useQuery
  });

  useEffect(() => {
    // Redirect if user is not the owner
    if (listingData?.listing && currentUser && listingData.listing.user._id !== currentUser._id) {
      toast.error("You are not authorized to edit this listing.");
      navigate(`/listings/${listingId}`);
    }
  }, [listingData, currentUser, navigate, listingId]);


  const { mutate: submitUpdateListing, isLoading: isUpdating } = useMutation({
    mutationFn: (formData) => updateListing(listingId, formData),
    onSuccess: (data) => {
      toast.success('Listing updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] }); // Invalidate single listing cache
      queryClient.invalidateQueries({ queryKey: ['listings'] }); // Invalidate all listings cache
      navigate(`/listings/${listingId}`);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Failed to update listing.";
      toast.error(errorMsg);
    },
  });

  const handleNewPhotoChange = (event) => {
    const files = Array.from(event.target.files);
    form.setValue('photos', files, { shouldValidate: true }); // 'photos' holds NEW files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const togglePhotoForDeletion = (public_id) => {
    setPhotosToDelete(prev => 
      prev.includes(public_id) ? prev.filter(id => id !== public_id) : [...prev, public_id]
    );
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
      if (key === 'photos' && data.photos && data.photos.length > 0) {
        data.photos.forEach(photoFile => {
          formData.append('photos', photoFile); // New files
        });
      } else if (key === 'tags' && Array.isArray(data.tags)) {
        // Schema transforms input string to array. Append each tag.
        data.tags.forEach(tag => formData.append('tags[]', tag));
      } else if (key === 'longitude' || key === 'latitude') {
         if (data.longitude && data.latitude && !isNaN(parseFloat(data.longitude)) && !isNaN(parseFloat(data.latitude))) {
            formData.append('coordinates[0]', data.longitude);
            formData.append('coordinates[1]', data.latitude);
        } else if (key === 'longitude' && data.longitude === '') { // User cleared longitude
            formData.append('coordinates[0]', ''); // Signal to backend to clear if desired
        } else if (key === 'latitude' && data.latitude === '') { // User cleared latitude
            formData.append('coordinates[1]', ''); // Signal to backend to clear if desired
        }
      } else if (data[key] !== undefined && key !== 'deletePhotos') { 
        // Exclude deletePhotos from direct append, it's handled separately
        formData.append(key, data[key]);
      }
    });

    // Append photos marked for deletion
    if (photosToDelete.length > 0) {
      photosToDelete.forEach(public_id => {
        formData.append('deletePhotos[]', public_id);
      });
    }
    
    // Append status if it's in the form data (it should be if we add it to form schema)
    if (data.status) {
        formData.append('status', data.status);
    }


    submitUpdateListing(formData);
  };

  if (isLoadingListing) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  if (fetchError || !listingData?.listing) return <div className="text-center py-10 text-red-500">Error loading listing for editing. {fetchError?.message}</div>;
  // Ownership check already done in useEffect, but good to have a final check before render
  if (listingData?.listing && currentUser && listingData.listing.user._id !== currentUser._id) {
    return <div className="text-center py-10 text-red-500">Unauthorized to edit this listing.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Edit Listing</CardTitle>
          <CardDescription>Update the details of your listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* --- FormFields similar to CreateListingPage --- */}
              {/* Listing Type (usually not editable, or handle with care) */}
               <FormField control={form.control} name="listingType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Listing Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                      <SelectContent>{listingTypes.map(type => (<SelectItem key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>))}</SelectContent>
                    </Select> <FormMessage /> </FormItem>
                )} />
              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description*</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>{categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              {/* Existing Photos Management */}
              {existingPhotos.length > 0 && (
                <FormItem>
                  <FormLabel>Manage Existing Photos</FormLabel>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {existingPhotos.map(photo => (
                      <div key={photo.public_id} className="relative group">
                        <img src={photo.url} alt="Existing listing photo" className="rounded-md object-cover h-32 w-full" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
                           <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100"
                              onClick={() => togglePhotoForDeletion(photo.public_id)}
                            >
                              {photosToDelete.includes(photo.public_id) ? <X className="mr-1 h-4 w-4"/> : <Trash2 className="mr-1 h-4 w-4"/>}
                              {photosToDelete.includes(photo.public_id) ? 'Undo' : 'Delete'}
                           </Button>
                        </div>
                         {photosToDelete.includes(photo.public_id) && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center rounded-md">
                                <span className="text-white font-bold text-xs">MARKED FOR DELETION</span>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}

              {/* New Photos Upload */}
              <FormItem>
                <FormLabel>Add New Photos (Up to {MAX_TOTAL_FILES - (existingPhotos.length - photosToDelete.length)})</FormLabel>
                <FormControl>
                  <Input type="file" multiple accept="image/*" onChange={handleNewPhotoChange} 
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </FormControl>
                {form.formState.errors.photos && <FormMessage>{form.formState.errors.photos.message || form.formState.errors.photos.root?.message}</FormMessage>}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {imagePreviews.map((previewUrl, index) => (
                      <img key={index} src={previewUrl} alt={`New preview ${index + 1}`} className="rounded-md object-cover h-32 w-full" />
                    ))}
                  </div>
                )}
              </FormItem>
              
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel>Longitude</FormLabel> <FormControl><Input type="number" step="any" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel>Latitude</FormLabel> <FormControl><Input type="number" step="any" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>

              <FormField control={form.control} name="estimatedEffort" render={({ field }) => (<FormItem><FormLabel>Estimated Effort/Value</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="exchangePreference" render={({ field }) => (<FormItem><FormLabel>Exchange Preference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              {/* Status - Add if editable for owner */}
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['active', 'pending_exchange', 'completed', 'cancelled'].map(status => (
                          <SelectItem key={status} value={status} className="capitalize">{status.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isUpdating || isLoadingListing}>
                {isUpdating ? <LoadingSpinner size={20} /> : 'Update Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditListingPage;