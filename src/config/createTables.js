const pool = require('./database');

async function createTables() {
    try {
        // Supprimer la table existante si elle existe
        await pool.execute('DROP TABLE IF EXISTS interviews');

        // Créer la table interviews avec UUID
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS interviews (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                job_title VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                interview_date TIMESTAMP NULL,
                status VARCHAR(50) DEFAULT 'pending',
                completed_questions INT DEFAULT 0,
                total_questions INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Créer la table video_answers avec UUID
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS video_answers (
                id VARCHAR(36) PRIMARY KEY,
                interview_id VARCHAR(36) NOT NULL,
                question_id VARCHAR(36) NOT NULL,
                video_url VARCHAR(255) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (interview_id) REFERENCES interviews(id)
            )
        `);

        console.log('Tables créées avec succès!');
    } catch (error) {
        console.error('Erreur lors de la création des tables:', error);
    } finally {
        await pool.end();
    }
}

createTables(); 