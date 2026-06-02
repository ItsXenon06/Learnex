THIS FILE IS FOR KEEPING TRACK OF SOME STUFF THAT I MYSELF WANT TO KEEP TRACK OF:

**TODOS:**

**-BACKEND:**

\# May need some database tweaks to flag some stuff( who joins what group or smth). May already be there but dont know and is front end error, still need to pay attention

**-FRONTEND:**

\# Shows more explicit error for registration and similar problems

\# PHOTO ISSUES PERSIST.

\# Right tab needs some work: "see all" buttons, mock data

\# (Potential) Unread/read notif inconsistencies?

\# All join group / leave group button inconsistent, doesn't show anything and may not even work. Need to do smth about deleting it or smth

\# Work on logo workaround of picture (default options changing to default avatar like facebook but with a grad hat)

\# Change user bio to show username(the one you type in register) as default name and not first name + last name, with first name and last name still shown somewhere for admin page mentioned later

\# Add missing vi Json lines and fix formatting if log out after switching to VI

\# Searching for part of a username works but makes a space between the hightlighted(searched) part and the unsearch part

**INFO/NOTES:**

\-There is a stray variable taking admin email that i left stray somewhere in a controller or service.

\-Considering a page to collect some info (if theres alot of thing i need them to configure) but unlikely

\-Absolutely considering a admin only page that only shows and accessible if login using admin account. 

\-Edit bio use to work but is broken now (goes blank, potentially page jsx error)

**ERROR LOG SECTION:**

Manifest: Line: 1, column: 1, Syntax error.Understand this error

react-dom\_client.js?v=d271265c:14338 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools

manifest.json:1 Manifest: Line: 1, column: 1, Syntax error.Understand this error

GroupsPage.jsx:441 Uncaught ReferenceError: starred is not defined

&#x20;   at GroupsPage (GroupsPage.jsx:441:27)

&#x20;   at Object.react\_stack\_bottom\_frame (react-dom\_client.js?v=d271265c:12868:12)

&#x20;   at renderWithHooks (react-dom\_client.js?v=d271265c:4213:19)

&#x20;   at updateFunctionComponent (react-dom\_client.js?v=d271265c:5569:16)

&#x20;   at beginWork (react-dom\_client.js?v=d271265c:6140:20)

&#x20;   at runWithFiberInDEV (react-dom\_client.js?v=d271265c:851:66)

&#x20;   at performUnitOfWork (react-dom\_client.js?v=d271265c:8429:92)

&#x20;   at workLoopSync (react-dom\_client.js?v=d271265c:8325:37)

&#x20;   at renderRootSync (react-dom\_client.js?v=d271265c:8309:6)

&#x20;   at performWorkOnRoot (react-dom\_client.js?v=d271265c:7994:27)Understand this error

react-dom\_client.js?v=d271265c:5258 An error occurred in the <GroupsPage> component.



Consider adding an error boundary to your tree to customize error handling behavior.

Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

Manifest: Line: 1, column: 1, Syntax error.

react-dom\_client.js?v=d271265c:14338 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools

manifest.json:1 Manifest: Line: 1, column: 1, Syntax error.

ProfilePage.jsx:418 Uncaught ReferenceError: showUrlInput is not defined

&#x20;   at EditModal (ProfilePage.jsx:418:22)



