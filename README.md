# Cybersense
Final Year Project of Cybersense: Chrome Extension for Real-Time Cyberbullying Detection

If you wish to execute our code, please follow these instructions carefully:
1. Please download these files:
a. FYP Code (BERT).ipynb
b. cyberbullying_tweets.csv
c. cybersense.py
d. manifest.json
e. content.js
f. popup.html
g. popup.js
h. styles.css
i. background.js
2. Save all the files in a single folder on your system.
3. Run the “FYP Code (BERT).ipynb”. To save your device's storage, please run it in Google Colab and change the runtype to “T4 GPU” to allow faster execution. The process may take several hours to complete.
4. After execution, a file named cyberbullying_model.pth will be created. If you are using Google Colab, download this file manually. Save the file in the same folder where you saved the other files.
5. Open the cybersense.py file in your preferred Integrated Development Environment (IDE), such as Visual Studio Code. Execute the script to start the backend.
6. Open Google Chrome and navigate to chrome://extensions. 
7. Enable Developer Mode in the top-right corner.
8. Click on the "Load unpacked" button and select the folder containing all the downloaded files.
9. Access any website in Google Chrome. Click on the puzzle icon located between the address bar and your Google profile.
10. Select the Cybersense System and activate it.
11. To check the scanned words, Right-click on the Cybersense User Interface (UI) and click Inspect.
12. Navigate to the Console tab to view all the scanned words and their corresponding cyberbullying classification.
