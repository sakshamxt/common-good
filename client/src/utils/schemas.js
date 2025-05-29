// src/utils/schemas.js
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, { message: "Name must be at most 50 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // min(1) to ensure it's not empty
});


const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_FILES = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024, `Max file size is ${MAX_FILE_SIZE_MB}MB.`)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png, .webp and .gif files are accepted.");

export const listingFormSchema = z.object({
  listingType: z.enum(['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'], {
    required_error: "Listing type is required.",
  }),
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title must be at most 100 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000, "Description must be at most 1000 characters."),
  category: z.string().min(1, "Category is required."),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag) : []), // Transforms comma-separated string to array
  // For photos: React Hook Form will handle FileList. We validate it customly or accept it for FormData.
  // Zod struggles with FileList directly, so we often handle 'photos' field type more loosely here
  // and do specific checks in the component or rely on server validation for exact file properties.
  // Let's make it an array of files for easier handling with previews.
  photos: z.array(fileSchema).optional().refine(files => !files || files.length <= MAX_TOTAL_FILES, `You can upload a maximum of ${MAX_TOTAL_FILES} images.`),
  
  estimatedEffort: z.string().optional(),
  exchangePreference: z.string().optional(),
  location: z.string().min(1, "Location is required."), // Make location required
  // Coordinates are optional and can be derived or manually input
  // For simplicity, we'll handle coordinates directly as string inputs for lon/lat or let backend geocode 'location'
  longitude: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), "Longitude must be a number if provided."),
  latitude: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), "Latitude must be a number if provided."),
});

// For editing, most fields are optional if not being changed.
// However, if a value is provided, it should still meet validation.
// This can be achieved by making fields optional at the top level or by using .partial()
// For simplicity, we can reuse listingFormSchema and handle "optionality" by how we submit data
// Or create a specific update schema:
export const updateListingFormSchema = listingFormSchema.partial().extend({
  // If photos are updated, the 'photos' field will contain new files.
  // We'll need a separate way to signal deletion of existing photos.
  deletePhotos: z.array(z.string()).optional(), // Array of public_ids to delete
});



const MAX_PROFILE_PIC_SIZE_MB = 2;

const profilePicFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_PROFILE_PIC_SIZE_MB * 1024 * 1024, `Max file size is ${MAX_PROFILE_PIC_SIZE_MB}MB.`)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png, and .webp files are accepted.");

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name too long.").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().nullable(),
  location: z.string().max(100, "Location too long.").optional().nullable(),
  // For skills, we'll take comma-separated strings and transform them
  skillsOffered: z.string().optional().transform(val => val ? val.split(',').map(skill => skill.trim()).filter(skill => skill) : []),
  skillsSought: z.string().optional().transform(val => val ? val.split(',').map(skill => skill.trim()).filter(skill => skill) : []),
  profilePicture: z.union([z.null(), profilePicFileSchema, z.string()]).optional(), // Can be null (no change), a new File, or a string (existing URL - though we don't submit URL)
  // Coordinates (optional, similar to listing form)
  longitude: z.string().optional().nullable().refine(val => !val || !isNaN(parseFloat(val)), "Longitude must be a number if provided."),
  latitude: z.string().optional().nullable().refine(val => !val || !isNaN(parseFloat(val)), "Latitude must be a number if provided."),
});
