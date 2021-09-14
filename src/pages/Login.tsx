import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import './Home.css';

import IntuneMAM from '../IntuneMAM';
import { useHistory } from 'react-router';

const Login: React.FC = () => {
  const history = useHistory();

  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    async function getVersion() {
      setVersion((await IntuneMAM.sdkVersion()).version);
    }
    getVersion();
  });

  const login = useCallback(async () => {
    await IntuneMAM.loginAndEnrollAccount();
    /*
    const user = await IntuneMAM.enrolledAccount();

    if (user.upn) {
      console.log('Got user, going home');
      setTimeout(() => history.replace('/home'), 500);
    } else {
      console.log('No user, logging in');
      setTimeout(() => history.replace('/login'), 500);
    }
    */
  }, []);

  const showConsole = useCallback(async () => {
    await IntuneMAM.displayDiagnosticConsole();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Login</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonButton onClick={login}>Log in</IonButton>
        <IonButton onClick={showConsole}>Show Console</IonButton>
        {version && <p>SDK Version: {version}</p>}
      </IonContent>
    </IonPage>
  );
};

export default Login;
