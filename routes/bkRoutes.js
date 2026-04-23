const express = require('express');
const router = express.Router();
const bk = require('../controllers/bkController');


router.get('/kuis', bk.getKuis);                          
router.get('/kuis/:id', bk.getKuisById);                  
router.post('/kuis', bk.createKuis);       
router.put('/kuis/:id', bk.updateKuis);    
router.delete('/kuis/:id', bk.deleteKuis); 

router.get('/soal/kuis/:kuisId', bk.getSoalByKuis);       
router.post('/soal', bk.createSoal);       
router.put('/soal/:id', bk.updateSoal);    
router.delete('/soal/:id', bk.deleteSoal); 
router.patch('/:id/essay', bk.updateEssayScore);

router.post('/submit', bk.submitKuis); 

router.get('/hasil', bk.getHasil);              
router.get('/hasil/statistik', bk.getStatistik); 
router.get('/hasil/:id', bk.getHasilById);      
router.patch('/hasil/:id/catatan', bk.updateCatatanHasil); 

router.get('/jadwal', bk.getJadwal);             
router.post('/jadwal', bk.createJadwal); 
router.put('/jadwal/:id', bk.updateJadwal); 
router.delete('/jadwal/:id', bk.deleteJadwal); 

module.exports = router;