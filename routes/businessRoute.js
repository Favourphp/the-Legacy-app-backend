const express = require('express');
const router = express.Router();
const {uploadFields} = require('../config/multer');

const { 
    createBusinessController, 
    deleteBusinessController, 
    updateBusinessController, 
    getBusinessesController,
    contactedBusinessController,
    getContactedBusinessesController,
    checkBusinessContactStatus,
    deleteBusinessImagesController
 } = require('../controllers/businessController');


router.post('/', uploadFields, createBusinessController)  
router.get('/:category', getBusinessesController);
router.put('/:id', uploadFields, updateBusinessController);
router.delete('/:id', deleteBusinessController);
router.post('/create-contact', contactedBusinessController)
router.get('/:userId', getContactedBusinessesController)
router.get('/contact-status/:userId/:businessId', checkBusinessContactStatus);
router.delete('/:id/images', deleteBusinessImagesController);

module.exports = router;