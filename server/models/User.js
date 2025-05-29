import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name.'],
            trim: true,
        },
            email: {
            type: String,
            required: [true, 'Please provide your email.'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address.',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password.'],
            minlength: [8, 'Password must be at least 8 characters long.'],
            select: false,
        },
        profilePictureUrl: {
            type: String,
            default: 'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_thumb,g_face,r_max/ अबू /default_profile.png' // A generic default
        },
        profilePicturePublicId: { // To store Cloudinary public_id for deletion/updates
                type: String,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Bio cannot be more than 500 characters.'],
        },
        location: { // User-friendly location string e.g., "City, Zip"
            type: String,
            trim: true,
        },
        coordinates: { // For geospatial queries
            type: {
                type: String,
                enum: ['Point'],
                // required: true // Make this required if location is mandatory and geocoded
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                // required: true
            },
        },
        skillsOffered: [{
            type: String,
            trim: true,
        }],
        skillsSought: [{
            type: String,
            trim: true,
        }],
        averageRating: {
        type: Number,
            default: 0, // Or null if you prefer to distinguish between no ratings and a 0 rating
            min: [0, 'Rating must be at least 0.'], // Can be 0 if no reviews
            max: [5, 'Rating must be at most 5.'],
            set: (val) => Math.round(val * 10) / 10, // Rounds to one decimal place on set
        },
        numReviews: {
            type: Number,
            default: 0,
        },

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


// Geospatial index for coordinates
// This allows efficient querying for users "near" a certain point.
userSchema.index({ coordinates: '2dsphere' });



// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});


// Instance method to compare candidate password with hashed password in DB
userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword // userPassword is the hashed password from the DB
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


const User = mongoose.model('User', userSchema);

export default User;