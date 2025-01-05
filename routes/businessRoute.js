const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { 
    createBusinessController, 
    deleteBusinessController, 
    updateBusinessController, 
    getBusinessesController,
    contactedBusinessController,
    getContactedBusinessesController,
    checkBusinessContactStatus,
 } = require('../controllers/businessController');


router.post('/', upload.single('businessImage'), createBusinessController)  
router.get('/:category', getBusinessesController);
router.put('/:id', upload.single('businessImage'), updateBusinessController);
router.delete('/:id', deleteBusinessController);
router.post('/create-contact', contactedBusinessController)
router.get('/:userId', getContactedBusinessesController)
router.get('/contact-status/:userId/:businessId', checkBusinessContactStatus);


module.exports = router;