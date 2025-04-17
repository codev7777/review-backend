import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import campaignValidation from '../../validations/campaign.validation';
import campaignController from '../../controllers/campaign.controller';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(campaignValidation.createCampaign), campaignController.createCampaign)
  .get(validate(campaignValidation.getCampaigns), campaignController.getCampaigns);

router
  .route('/:campaignId')
  .get(validate(campaignValidation.getCampaign), campaignController.getCampaign)
  .patch(auth(), validate(campaignValidation.updateCampaign), campaignController.updateCampaign)
  .delete(auth(), validate(campaignValidation.deleteCampaign), campaignController.deleteCampaign);

router.get('/:id', auth(), campaignController.getCampaignById);
router.get('/company/:companyId', auth(), campaignController.getCompanyCampaigns);

export default router;
