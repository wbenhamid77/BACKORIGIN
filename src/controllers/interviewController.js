const pool = require('../config/database');
const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Créer une nouvelle interview
const createInterview = async (req, res) => {
    try {
        const { user_id, job_title, company_name, interview_date } = req.body;

        console.log('Données reçues:', { user_id, job_title, company_name, interview_date });

        // Validation des champs requis
        if (!user_id || !job_title) {
            return res.status(400).json({ 
                error: 'Champs requis manquants',
                details: 'user_id et job_title sont requis',
                received: { user_id, job_title, company_name, interview_date }
            });
        }

        // Générer un UUID
        const id = uuidv4();
        console.log('UUID généré:', id);

        // Convertir la date ISO en format MySQL
        let mysqlDate = null;
        if (interview_date) {
            try {
                const date = new Date(interview_date);
                mysqlDate = date.toISOString().slice(0, 19).replace('T', ' ');
                console.log('Date convertie:', mysqlDate);
            } catch (error) {
                console.error('Erreur de conversion de date:', error);
                return res.status(400).json({ 
                    error: 'Format de date invalide',
                    details: 'La date doit être au format ISO (ex: 2024-03-20T10:00:00Z)'
                });
            }
        }

        // Préparer la requête SQL
        const sql = 'INSERT INTO interviews (id, user_id, job_title, company_name, interview_date) VALUES (?, ?, ?, ?, ?)';
        const values = [id, user_id, job_title, company_name, mysqlDate];

        console.log('Requête SQL:', sql);
        console.log('Valeurs:', values);

        // Exécuter la requête
        const [result] = await pool.execute(sql, values);
        console.log('Résultat de l\'insertion:', result);

        // Récupérer l'interview créée
        const [interview] = await pool.execute(
            'SELECT * FROM interviews WHERE id = ?',
            [id]
        );

        console.log('Interview créée:', interview[0]);

        res.status(201).json(interview[0]);
    } catch (error) {
        console.error('Erreur détaillée lors de la création de l\'interview:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création de l\'interview',
            details: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sql: error.sql
        });
    }
};

// Récupérer toutes les interviews
const getAllInterviews = async (req, res) => {
    try {
        const [interviews] = await pool.execute('SELECT * FROM interviews');
        res.json(interviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des interviews:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des interviews' });
    }
};

// Récupérer une interview par ID
const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const [interview] = await pool.execute(
            'SELECT * FROM interviews WHERE id = ?',
            [id]
        );

        if (interview.length === 0) {
            return res.status(404).json({ error: 'Interview non trouvée' });
        }

        res.json(interview[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'interview:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'interview' });
    }
};

// Récupérer les interviews d'un utilisateur
const getInterviewByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const [interviews] = await pool.execute(
            'SELECT * FROM interviews WHERE user_id = ?',
            [userId]
        );
        res.json(interviews);
    } catch (error) {
        console.error('Erreur lors de la récupération des interviews:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des interviews' });
    }
};

// Mettre à jour une interview
const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { job_title, company_name, interview_date, status, completed_questions } = req.body;

        const [result] = await pool.execute(
            'UPDATE interviews SET job_title = ?, company_name = ?, interview_date = ?, status = ?, completed_questions = ? WHERE id = ?',
            [job_title, company_name, interview_date, status, completed_questions, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Interview non trouvée' });
        }

        const [interview] = await pool.execute(
            'SELECT * FROM interviews WHERE id = ?',
            [id]
        );

        res.json(interview[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'interview:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'interview' });
    }
};

// Supprimer une interview
const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute(
            'DELETE FROM interviews WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Interview non trouvée' });
        }

        res.json({ message: 'Interview supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'interview:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'interview' });
    }
};

module.exports = {
    createInterview,
    getAllInterviews,
    getInterviewById,
    getInterviewByUserId,
    updateInterview,
    deleteInterview
}; 