import connection from './db';

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const [rows] = await connection.execute('SELECT 1 as health_check');
    return { healthy: true };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return { 
      healthy: false, 
      error: error.message 
    };
  }
}