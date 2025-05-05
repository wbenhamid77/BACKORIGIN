const pool = require('./database');

async function checkDatabase() {
    try {
        // Vérifier la connexion
        const [rows] = await pool.execute('SELECT 1');
        console.log('Connexion à MySQL réussie!');

        // Vérifier si la base de données existe
        const [databases] = await pool.execute('SHOW DATABASES');
        console.log('Bases de données disponibles:', databases);

        // Vérifier les tables dans cv_interview_db
        const [tables] = await pool.execute('SHOW TABLES FROM cv_interview_db');
        console.log('Tables dans cv_interview_db:', tables);

        // Vérifier la structure de la table interviews
        const [structure] = await pool.execute('DESCRIBE cv_interview_db.interviews');
        console.log('Structure de la table interviews:', structure);

    } catch (error) {
        console.error('Erreur lors de la vérification de la base de données:', error);
    } finally {
        await pool.end();
    }
}

checkDatabase(); 