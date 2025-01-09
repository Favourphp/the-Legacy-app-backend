const express = require('express');
const router = express.Router();
const {uploadMultiple} = require('../config/multer');
const { 
    createBusinessController, 
    deleteBusinessController, 
    updateBusinessController, 
    getBusinessesController,
    contactedBusinessController,
    getContactedBusinessesController,
    checkBusinessContactStatus,
 } = require('../controllers/businessController');


router.post('/', uploadMultiple, createBusinessController)  
router.get('/:category', getBusinessesController);
router.put('/:id', uploadMultiple, updateBusinessController);
router.delete('/:id', deleteBusinessController);
router.post('/create-contact', contactedBusinessController)
router.get('/:userId', getContactedBusinessesController)
router.get('/contact-status/:userId/:businessId', checkBusinessContactStatus);


module.exports = router;