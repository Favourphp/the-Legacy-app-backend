const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
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


router.post('/', verifyToken, uploadFields, createBusinessController)  
router.get('/:category',verifyToken, getBusinessesController);
router.put('/:id', verifyToken, uploadFields, updateBusinessController);
router.delete('/:id', verifyToken, deleteBusinessController);
router.post('/create-contact', contactedBusinessController)
router.get('/:userId', getContactedBusinessesController)
router.get('/contact-status/:userId/:businessId', checkBusinessContactStatus);
router.delete('/:id/images', deleteBusinessImagesController);

module.exports = router;