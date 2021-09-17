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
import ExploreContainer from "../components/ExploreContainer";
import "./Home.css";

import { IntuneMAM } from "@ionic-enterprise/intune";

const Splash: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    async function checkUser() {
      const user = await IntuneMAM.enrolledAccount();

      if (user.upn) {
        console.log("Got user, going home");
        setTimeout(() => history.replace("/home"), 500);
      } else {
        console.log("No user, logging in");
        setTimeout(() => history.replace("/login"), 500);
      }
    }

    checkUser();
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
