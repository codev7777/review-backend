import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { companyValidation } from '../../validations';
import { companyController } from '../../controllers';

const router = express.Router();

router
  .route('/')
  .post(
    auth('manageCompanies'),
    validate(companyValidation.createCompany),
    companyController.createCompany
  )
  .get(
    auth('getCompanies'),
    validate(companyValidation.getCompanies),
    companyController.getCompanies
  );

router
  .route('/:companyId')
  .get(auth('getCompanies'), validate(companyValidation.getCompany), companyController.getCompany)
  .patch(
    auth('manageCompanies'),
    validate(companyValidation.updateCompany),
    companyController.updateCompany
  )
  .delete(
    auth('manageCompanies'),
    validate(companyValidation.deleteCompany),
    companyController.deleteCompany
  );

// Company users endpoints
router
  .route('/:companyId/users')
  .get(auth(), companyController.getCompanyUsers)
  .post(auth(), validate(companyValidation.inviteUser), companyController.inviteUser);

router.route('/:companyId/users/:userId').delete(auth(), companyController.removeUser);

export default router;

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management and retrieval
 */

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a company
 *     description: Only admins can create companies.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *               detail:
 *                 type: string
 *                 description: Company details
 *               logo:
 *                 type: string
 *                 description: Company logo URL
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 description: Company website URL
 *               planId:
 *                 type: integer
 *                 description: Company plan ID
 *     responses:
 *       201:
 *         description: Company created successfully
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get all companies
 *     description: Only admins can retrieve all companies.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Company name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of companies
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /companies/{companyId}:
 *   get:
 *     summary: Get a company by id
 *     description: Only admins can retrieve companies.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company id
 *     responses:
 *       200:
 *         description: Company details
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
 *   patch:
 *     summary: Update a company
 *     description: Only admins can update companies.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *               detail:
 *                 type: string
 *                 description: Company details
 *               logo:
 *                 type: string
 *                 description: Company logo URL
 *               websiteUrl:
 *                 type: string
 *                 format: uri
 *                 description: Company website URL
 *               planId:
 *                 type: integer
 *                 description: Company plan ID
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
 *   delete:
 *     summary: Delete a company
 *     description: Only admins can delete companies.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company id
 *     responses:
 *       204:
 *         description: Company deleted successfully
 *       401:
 *         description: Please authenticate
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Company not found
 */
