import webpay from '../../assets/webpay.png';
import styles from './FooterComponent.module.css';

export const FooterComponent = () => {

    return (
        <footer className={`${styles.footer}`}>
            <div className={styles.tecnologies}>                
                <div>
                    <ul>
                        <li>Frontend:</li>
                        <li>React</li>
                        <li>CSS</li>
                        <li>Zustand</li>
                        <li>React Router</li>
                        <li>Custom Hooks</li>
                        <li>Zod</li>
                        <li>Axios</li>
                        <li>Create React App</li>
                    </ul>
                </div>
                <div>
                    <ul>
                        <li>Backend:</li>
                        <li>Node.js</li>
                        <li>Express.js</li>
                        <li>JWT</li>
                        <li>bcrypt</li>
                        <li>Jest</li>
                        <li>Supertest</li>
                        <li>Swagger</li>
                    </ul>
                </div>
                <div>
                    <ul>
                        <li>Base de Datos:</li>
                        <li>MySQL</li>
                    </ul>
                    <ul>
                        <li>Contenerización:</li>
                        <li>Docker</li>
                    </ul>
                </div>
                <div>
                    <ul>
                        <li>Servidores:</li>
                        <li>Oracle Free Tier</li>
                        <li>Netlify</li>
                    </ul>
                </div>
                <div>
                    <ul>
                        <li>Otras tecnolologías:</li>
                        <li>Git</li>
                        <li>Github</li>
                        <li>Github Actions</li>
                        <li>CI/CD</li>
                        <li>Copilot</li>
                        <li>OpenCode</li>
                    </ul>
                </div>
                <div>
                    <div className={styles.webpayIntegration}>Integración con WebPay</div>
                    <div>
                        <img className={styles.webpayLogo} src={webpay} alt="WebPay" />
                    </div>
                </div>
            </div>
            <div className={styles.developer}>
                Desarrollado por Marcelo Bravo C. Talca, Chile 2026
            </div>
        </footer>
    );
};