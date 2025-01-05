const Business = require('../models/businessModel');
const Contact = require('../models/contactModel');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const createBusinessController = async (req, res) => {
    const { category, businessName, address, rating, description } = req.body;
  
    try {
      let businessImage = null;
  
      // Handle image upload if a file is present
      if (req.file) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        businessImage = uploadResult.secure_url; // Assign the uploaded image URL to businessImage
      }
  
      // Create a new business entry
      const newBusiness = new Business({
        category,
        businessName,
        businessImage, // Add the image URL (if uploaded)
        address,
        rating,
        description,
      });
  
      // Save the business to the database
      const savedBusiness = await newBusiness.save();
  
      // Respond with the saved business
      res.status(201).json(savedBusiness);
    } catch (error) {
      console.error('Error creating business:', error);
      res.status(500).json({ message: 'Failed to create business' });
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
    const { category, businessName, address, rating, description } = req.body;
    const businessImage = req.file ? req.file.path : null;
  
    try {
      const updatedBusiness = await Business.findByIdAndUpdate(
        id,
        { category, businessName, businessImage, address, rating, description },
        { new: true }
      );
      if (!updatedBusiness) return res.status(404).json({ message: 'Business not found' });
       if (req.file) {
            // If a file is present, upload the new profile photo to cloudinary
            const uploadResult = await cloudinary.uploader.upload(req.file.path);
            updatedBusiness.businessImage = uploadResult.secure_url; // Assign the new profile photo URL
          }
   
          await updatedBusiness.save();

      res.status(200).json(updatedBusiness);
    } catch (error) {
      console.error('Error updating business:', error);
      res.status(500).json({ message: 'Failed to update business' });
    }
  }

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
    };