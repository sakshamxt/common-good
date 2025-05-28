// utils/apiFeatures.js
class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query object (e.g., Listing.find())
    this.queryString = queryString; // Query parameters from Express (req.query)
  }

  filter() {
    // 1A) Basic Filtering (excluding special fields like page, sort, limit, fields)
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'latlng', 'distance']; // Add geospatial query params
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this; // Return the entire object to allow chaining
  }

  search() {
    // For text search using MongoDB's $text operator
    // Requires a text index on the model: e.g., schema.index({ title: 'text', description: 'text', tags: 'text' });
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      this.query = this.query.find({ $text: { $search: searchTerm } });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); // Mongoose expects 'field1 field2'
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt'); // Default sort by newest
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // Exclude __v by default
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // Convert to number, default to 1
    const limit = this.queryString.limit * 1 || 100; // Default to 100 results per page
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  geospatial() {
    // Geospatial search for listings within a certain radius
    // Expects: ?latlng=latitude,longitude&distance=radiusInKm
    if (this.queryString.latlng && this.queryString.distance) {
      const [lat, lng] = this.queryString.latlng.split(',');
      const radius = this.queryString.distance * 1; // in kilometers

      if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        // Handle error or ignore: Invalid latlng format
        console.warn('Invalid latlng format for geospatial query');
        return this;
      }
      if (isNaN(radius) || radius <= 0) {
        console.warn('Invalid distance for geospatial query');
        return this;
      }

      // Earth's radius in kilometers. For miles, use 3963.2
      const earthRadiusKm = 6378.1;
      const radiusInRadians = radius / earthRadiusKm;

      this.query = this.query.find({
        coordinates: {
          $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians] }
        }
        // Alternative: $nearSphere for sorted results by distance (might require a different query structure)
        // coordinates: {
        //   $nearSphere: {
        //     $geometry: {
        //       type: "Point",
        //       coordinates: [parseFloat(lng), parseFloat(lat)]
        //     },
        //     $maxDistance: radius * 1000 // meters for $nearSphere $maxDistance
        //   }
        // }
      });
    }
    return this;
  }
}

export default APIFeatures;