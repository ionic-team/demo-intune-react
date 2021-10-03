import UIKit
// import Capacitor
import MSAL
// import Cordova

class AppDelegate: CDVAppDelegate {

    override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        self.viewController = MainViewController() //[[MainViewController alloc] init];
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
        //return [super application:application didFinishLaunchingWithOptions:launchOptions];
        // return true
    }

    override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        // return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        
    }
}
