const Business = require('../models/businessModel');
const Contact = require('../models/contactModel');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const createBusinessController = async (req, res) => {
  const { 
    category, 
    businessName, 
    address, 
    rating, 
    description, 
    fees, 
    years, 
    clients, 
    phoneNumber,
    headstoneNames,
    reviews,
    priceStartsFrom // Add this field in the request body
  } = req.body;

  try {
    let businessImages = [];
    let headstoneImage = null; // Initialize to handle headstone-specific image

    // Handle general business image uploads
    if (req.files.businessImages) {
      const uploadPromises = req.files.businessImages.map((file) =>
        cloudinary.uploader.upload(file.path)
      );
      const uploadResults = await Promise.all(uploadPromises);
      businessImages = uploadResults.map((result) => result.secure_url);
    }

    // Handle headstone-specific image upload if category is "headstones"
    if (req.files.headstoneImage) {
      const uploadPromises = req.files.headstoneImage.map((file) =>
        cloudinary.uploader.upload(file.path)
      );
      const uploadResults = await Promise.all(uploadPromises);
      headstoneImage = uploadResults.map((result) => result.secure_url);
    }

    // Build the business object
    const newBusinessData = {
      category,
      businessName,
      businessImages,
      address,
      rating,
      description,
      fees, // Store as a number in the database
      years,
      clients,
      reviews,
      phoneNumber,
    };

    // Add headstone-specific fields if category is "headstones"
    if (category.toLowerCase() === "headstones") {
      if (headstoneNames) {
        newBusinessData.headstoneNames = Array.isArray(headstoneNames)
          ? headstoneNames
          : [headstoneNames];
      }
      if (priceStartsFrom) {
        newBusinessData.priceStartsFrom = Array.isArray(priceStartsFrom)
        ? priceStartsFrom
        : [priceStartsFrom]; // Store as a number
      }
      if (headstoneImage) {
        newBusinessData.headstoneImage =Array.isArray(headstoneImage)
        ? headstoneImage
        : [headstoneImage]
      }
    }

    // Create a new business entry
    const newBusiness = new Business(newBusinessData);

    // Save the business to the database
    const savedBusiness = await newBusiness.save();

    // Format fees and priceStartsFrom with a dollar sign before sending the response
    const responseBusiness = {
      ...savedBusiness._doc,
      fees: `$${savedBusiness.fees.toLocaleString()}`, // Format fees
      ...(savedBusiness.priceStartsFrom && {
        priceStartsFrom: `$${savedBusiness.priceStartsFrom.toLocaleString()}`,
      }), // Format priceStartsFrom if it exists
    };

    // Respond with the formatted business
    res.status(201).json(responseBusiness);
  } catch (error) {
    console.error("Error creating business:", error);
    res.status(500).json({ message: "Failed to create business" });
  }
};


  const getBusinessesController = async (req, res) => {
    const { category } = req.params;
  
    try {
      const businesses = await Business.find({ category });
      res.status(200).json(businesses);
    } catch (error) {
      console.error('Error fetching businesses by category:', error);
      res.status(500).json({ message: 'Failed to fetch businesses by category' });
    }
  }

  const updateBusinessController = async (req, res) => {
    const { id } = req.params;
    const {
      businessName,
      address,
      rating,
      description,
      fees,
      years,
      clients,
      phoneNumber,
      reviews,
    } = req.body;
  
    try {
      // Find the business
      const business = await Business.findById(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
  
      // Update business fields
      business.businessName = businessName || business.businessName;
      business.address = address || business.address;
      business.rating = rating || business.rating;
      business.description = description || business.description;
      business.fees = fees || business.fees;
      business.years = years || business.years;
      business.clients = clients || business.clients;
      business.phoneNumber = phoneNumber || business.phoneNumber;
      business.reviews = reviews || business.reviews;
  
      // Handle `businessImages` updates
      if (req.files && req.files.businessImages) {
        const uploadPromises = req.files.businessImages.map((file) =>
          cloudinary.uploader.upload(file.path)
        );
        const uploadResults = await Promise.all(uploadPromises);
  
        // Update the `businessImages` field with new images
        business.businessImages = uploadResults.map((result) => result.secure_url);
      }
  
      // Save the updated business
      const updatedBusiness = await business.save();
  
      res.status(200).json(updatedBusiness);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  };
  
  

  const deleteBusinessController = async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedBusiness = await Business.findByIdAndDelete(id);
      if (!deletedBusiness) return res.status(404).json({ message: 'Business not found' });
  
      res.status(200).json({ message: 'Business deleted successfully' });
    } catch (error) {
      console.error('Error deleting business:', error);
      res.status(500).json({ message: 'Failed to delete business' });
    }
  }

  const deleteBusinessImagesController = async (req, res) => {
    const { id } = req.params;
    const { imagesToDelete } = req.body; // Array of image URLs to delete
  
    if (!Array.isArray(imagesToDelete) || imagesToDelete.length === 0) {
      return res.status(400).json({ message: 'No images specified for deletion' });
    }
  
    try {
      // Find the business
      const business = await Business.findById(id);
      if (!business) {
        return res.status(404).json({ message: 'Business not found' });
      }
  
      // Filter out the images to delete from the `businessImages` array
      const remainingImages = business.businessImages.filter(
        (image) => !imagesToDelete.includes(image)
      );
  
      // Check if all images were successfully removed
      if (remainingImages.length === business.businessImages.length) {
        return res
          .status(400)
          .json({ message: 'No matching images found to delete' });
      }
  
      // Update the `businessImages` field
      business.businessImages = remainingImages;
      await business.save();
  
      // Optionally delete the images from Cloudinary
      const deletePromises = imagesToDelete.map((imageUrl) => {
        const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public_id
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
  
      res.status(200).json({
        message: 'Images deleted successfully',
        remainingImages: business.businessImages,
      });
    } catch (error) {
      console.error('Error deleting business images:', error);
      res.status(500).json({ message: 'Failed to delete images' });
    }
  };
  

  const contactedBusinessController = async (req, res) => {
    const { userId, businessId } = req.body;
  
    console.log('Attempting to create contact with:', {
      userId,
      businessId
    });
  
    // Validate the businessId as an ObjectId
    if (!mongoose.isValidObjectId(businessId)) {
      console.log('Invalid businessId format:', businessId);
      return res.status(400).json({ message: 'Invalid businessId format' });
    }
  
    try {
      // Log the business search
      console.log('Searching for business with ID:', businessId);
      const businessExists = await Business.findById(businessId);
      
      if (!businessExists) {
        console.log('Business not found with ID:', businessId);
        return res.status(404).json({ message: 'Business not found' });
      }
      console.log('Found business:', {
        businessId: businessExists._id,
        businessName: businessExists.businessName
      });
  
      // Create a new contact
      const newContact = new Contact({
        user: userId,
        business: businessId,
      });
  
      const savedContact = await newContact.save();
      console.log('Successfully created contact:', {
        contactId: savedContact._id,
        userId: savedContact.user,
        businessId: savedContact.business,
        timestamp: savedContact.timestamp
      });
  
      // Fetch the complete contact with populated business details
      const populatedContact = await Contact.findById(savedContact._id)
        .populate('business', 'businessName address category description rating businessImage');
  
      console.log('Populated contact details:', populatedContact);
  
      res.status(201).json({
        message: 'Contact created successfully',
        contact: {
          _id: savedContact._id,
          user: savedContact.user,
          business: populatedContact.business,
          timestamp: savedContact.timestamp
        }
      });
    } catch (error) {
      console.error('Error logging contact:', error);
      res.status(500).json({ 
        message: 'Failed to log contact',
        error: error.message 
      });
    }
  };
  const getContactedBusinessesController = async (req, res) => {
    const { userId } = req.params;
  
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
    }
  
    try {
      console.log('Fetching all contacts for userId:', userId);
  
      // Find all contacts for this user and populate the business details
      const contacts = await Contact.find({ user: userId })
        .populate({
          path: 'business',
          select: 'businessName address category description rating businessImage'
        })
        .sort({ timestamp: -1 }); // Sort by most recent first
  
      console.log(`Found ${contacts.length} contacts for user`);
  
      if (!contacts || contacts.length === 0) {
        return res.status(404).json({ 
          message: 'No contacted businesses found for this user',
          contacts: []
        });
      }
  
      // Map the contacts to a more user-friendly format
      const formattedContacts = contacts.map(contact => ({
        contactId: contact._id,
        timestamp: contact.timestamp,
        business: {
          id: contact.business._id,
          businessName: contact.business.businessName,
          address: contact.business.address,
          category: contact.business.category,
          description: contact.business.description,
          rating: contact.business.rating,
          businessImage: contact.business.businessImage
        }
      }));
  
      console.log('Returning formatted contacts:', formattedContacts);
  
      res.status(200).json({
        message: 'Contacts retrieved successfully',
        count: formattedContacts.length,
        contacts: formattedContacts
      });
  
    } catch (error) {
      console.error('Error fetching contacted businesses:', error);
      res.status(500).json({ 
        message: 'Failed to fetch contacted businesses',
        error: error.message 
      });
    }
  };
  

  const checkBusinessContactStatus = async (req, res) => {
    const { userId, businessId } = req.params;
  
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
    }
  
    try {
      // Find all contacts for this user
      const allContacts = await Contact.find({ user: userId })
        .populate('business', 'businessName address category description rating businessImage')
        .sort({ timestamp: -1 }); // Sort by most recent first
  
      console.log(`Found ${allContacts.length} contacts for user:`, userId);
  
      // Filter out any contacts where the business is null (deleted businesses)
      const validContacts = allContacts.filter(contact => contact.business !== null);
  
      // If a specific businessId is provided, check its status
      if (businessId && mongoose.isValidObjectId(businessId)) {
        const specificContact = validContacts.find(
          contact => contact.business._id.toString() === businessId
        );
  
        const contactStatus = {
          contacted: !!specificContact,
          timestamp: specificContact ? specificContact.timestamp : null,
          business: specificContact ? specificContact.business : null
        };
  
        return res.status(200).json({
          currentBusinessStatus: contactStatus,
          allContacts: validContacts.map(contact => ({
            businessId: contact.business._id,
            businessName: contact.business.businessName,
            address: contact.business.address,
            category: contact.business.category,
            description: contact.business.description,
            rating: contact.business.rating,
            businessImage: contact.business.businessImage,
            timestamp: contact.timestamp
          }))
        });
      }
  
      // If no specific businessId, just return all valid contacts
      return res.status(200).json({
        allContacts: validContacts.map(contact => ({
          businessId: contact.business._id,
          businessName: contact.business.businessName,
          address: contact.business.address,
          category: contact.business.category,
          description: contact.business.description,
          rating: contact.business.rating,
          businessImage: contact.business.businessImage,
          timestamp: contact.timestamp
        }))
      });
  
    } catch (error) {
      console.error('Error checking contact status:', error);
      res.status(500).json({ 
        message: 'Failed to check contact status',
        error: error.message,
        // Add additional debug information
        userId: userId,
        businessId: businessId
      });
    }
  };
  
    module.exports = {
        getContactedBusinessesController,
        checkBusinessContactStatus,
        createBusinessController,
        deleteBusinessController,
        updateBusinessController,
        getBusinessesController,
        contactedBusinessController,
        deleteBusinessImagesController
    };