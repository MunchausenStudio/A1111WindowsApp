
# Windows App for A1111 / Forge

This is a simple Windows executable to launch a more classic software experience for Stable Diffusion A1111 or Forge (or any Stable Diffusion webui launched with a bat file)

[![AGPL License](https://img.shields.io/badge/License-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)


## Principle

Using Electron to encapsulate both the bat terminal output of Stable Diffusion / A1111 and the user interface that usually launch in a web browser window.

Adding some handy menus to complete it
## Tech used

**Built with :** NodeJS, Electron, Python


## Documentation
To make it work for your installation : 

You need to edit main.js file to change line 15 :

```javascript
  let SDA1111BasePath = 'YourA1111\\Folder';
```
and line 202 : 

```javascript
  const batchFilePath = SDA1111BasePath + '\\Your\\PathTo\\webui-user.bat';
```
and line 207 :

```javascript
  cwd: SDA1111BasePath + '\\PathTo\\your-stable-diffusion-ui-root',
```
You need to configure your webui to not launch the UI by default when starting, this is to prevent a webbrowser windows from being opened.
In A1111/Forge this can be found under 

Settings > System > Automatically open webui in browser on startup


## Deployment

To test this project run at the folder root level :

```bash
  npm start
```

To make the executable and installer run at the root level :

```bash
  npm run make
```
Make is using Electron forge, it will output an "out" folder at root with everything in it.