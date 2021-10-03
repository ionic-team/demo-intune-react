import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useHistory } from "react-router";
import { useCallback, useEffect } from "react";
import "./Home.css";

import type { IntuneMAMPlugin } from "@ionic-enterprise/intune/cordova/definitions";

const Splash: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    async function checkUser() {
      const IntuneMAM = (window as any).IntuneMAM as IntuneMAMPlugin;

      console.log("DeviceReady, Loaded intune", IntuneMAM);
      const user = await IntuneMAM.enrolledAccount();

      if (user.upn) {
        console.log("Got user, going home");
        setTimeout(() => history.replace("/home"), 500);
      } else {
        console.log("No user, logging in");
        setTimeout(() => history.replace("/login"), 500);
      }
    }

    document.addEventListener(
      "deviceready",
      async () => {
        checkUser();
      },
      false
    );
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Welcome</IonTitle>
          </IonToolbar>
        </IonHeader>
      </IonContent>
    </IonPage>
  );
};

export default Splash;
