// src/pages/profile/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema } from '@/utils/schemas';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserProfile } from '@/api/userService';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, loadUser, isLoading: isAuthLoading } = useAuth(); // Use loadUser to refresh context
  const queryClient = useQueryClient();

  const [imagePreview, setImagePreview] = useState(user?.profilePictureUrl || null);

  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      skillsOffered: Array.isArray(user?.skillsOffered) ? user.skillsOffered.join(', ') : "",
      skillsSought: Array.isArray(user?.skillsSought) ? user.skillsSought.join(', ') : "",
      profilePicture: null, // This field is for new uploads
      longitude: user?.coordinates?.coordinates?.[0]?.toString() || "",
      latitude: user?.coordinates?.coordinates?.[1]?.toString() || "",
    },
  });

  // Effect to reset form when user data changes (e.g., after initial load from AuthContext)
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        skillsOffered: Array.isArray(user.skillsOffered) ? user.skillsOffered.join(', ') : "",
        skillsSought: Array.isArray(user.skillsSought) ? user.skillsSought.join(', ') : "",
        profilePicture: null,
        longitude: user.coordinates?.coordinates?.[0]?.toString() || "",
        latitude: user.coordinates?.coordinates?.[1]?.toString() || "",
      });
      setImagePreview(user.profilePictureUrl || null);
    }
  }, [user, form.reset]);

  const { mutate: submitUpdateProfile, isLoading: isUpdating } = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      toast.success('Profile updated successfully!');
      loadUser(); // Reload user in AuthContext to reflect changes globally
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?._id] }); // Invalidate specific profile query if viewed elsewhere
      navigate('/profile/me');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Failed to update profile.";
      toast.error(errorMsg);
    },
  });

  const handlePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      form.setValue('profilePicture', file, { shouldValidate: true });
      setImagePreview(URL.createObjectURL(file));
    } else {
      form.setValue('profilePicture', null);
      setImagePreview(user?.profilePictureUrl || null); // Revert to original if file selection is cleared
    }
  };
  
  useEffect(() => {
    // Cleanup object URL
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  const onSubmit = (data) => {
    const formData = new FormData();
    // Append fields that are explicitly provided or different from original
    // This prevents sending empty strings for optional fields if they weren't touched
    // However, backend 'updateMe' filters fields, so sending all is also okay.
    
    if (data.name !== user?.name) formData.append('name', data.name);
    // For optional fields like bio, location, send if they have value or if they were cleared
    if (data.bio !== undefined) formData.append('bio', data.bio || ''); // Send empty string to clear
    if (data.location !== undefined) formData.append('location', data.location || '');

    // Skills are transformed to array by Zod schema, then joined by form default value.
    // Backend expects array of strings. The schema transforms input string to array.
    if (data.skillsOffered && data.skillsOffered.length > 0) {
      data.skillsOffered.forEach(skill => formData.append('skillsOffered[]', skill));
    } else if (data.skillsOffered && data.skillsOffered.length === 0 && user?.skillsOffered?.length > 0) {
      // If user cleared skills, send an empty array signal if backend supports it
      // For FormData, sending no 'skillsOffered[]' might be enough for backend to not update
      // Or send a specific signal, e.g. formData.append('skillsOffered', JSON.stringify([]));
      // For now, if empty array, don't append to keep it simple. Backend should handle no-update.
    }
    
    if (data.skillsSought && data.skillsSought.length > 0) {
      data.skillsSought.forEach(skill => formData.append('skillsSought[]', skill));
    } // Similar logic for clearing skillsSought

    if (data.profilePicture instanceof File) {
      formData.append('profilePicture', data.profilePicture);
    }

    // Handle coordinates
    if (data.longitude !== undefined && data.latitude !== undefined) {
        if (data.longitude && data.latitude && !isNaN(parseFloat(data.longitude)) && !isNaN(parseFloat(data.latitude))) {
            formData.append('coordinates[type]', 'Point'); // Backend expects type
            formData.append('coordinates[coordinates][0]', data.longitude);
            formData.append('coordinates[coordinates][1]', data.latitude);
        } else if (data.longitude === '' && data.latitude === '') {
            // If user clears both, signal to backend to remove coordinates
            formData.append('coordinates[type]', 'Point'); 
            formData.append('coordinates[coordinates]', ''); // Or a specific signal
        }
    }
    
    submitUpdateProfile(formData);
  };

  if (isAuthLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Edit Your Profile</CardTitle>
          <CardDescription>Update your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormItem className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32 border-2">
                  <AvatarImage src={imagePreview || undefined} alt={user.name} />
                  <AvatarFallback className="text-4xl">{user.name ? user.name.substring(0,2).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePictureChange} 
                    className="max-w-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </FormControl>
                <FormMessage>{form.formState.errors.profilePicture?.message}</FormMessage>
              </FormItem>

              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name*</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us a little about yourself..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., City, State" {...field} /></FormControl><FormMessage /></FormItem>)} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="longitude" render={({ field }) => ( <FormItem> <FormLabel>Longitude</FormLabel> <FormControl><Input type="number" step="any" placeholder="e.g., -73.985" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="latitude" render={({ field }) => ( <FormItem> <FormLabel>Latitude</FormLabel> <FormControl><Input type="number" step="any" placeholder="e.g., 40.748" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>


              <FormField control={form.control} name="skillsOffered" render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills You Offer</FormLabel>
                  <FormControl><Input placeholder="e.g., Web Development, Gardening, Tutoring" {...field} /></FormControl>
                  <FormDescription>Comma-separated values.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="skillsSought" render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills You Seek</FormLabel>
                  <FormControl><Input placeholder="e.g., Plumbing, Graphic Design, Yoga" {...field} /></FormControl>
                  <FormDescription>Comma-separated values.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              
              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? <LoadingSpinner size={20} /> : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfilePage;