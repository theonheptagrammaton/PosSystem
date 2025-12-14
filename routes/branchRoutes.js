const express = require('express');
const router = express.Router();
const { getAllBranches, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', getAllBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

module.exports = router;
