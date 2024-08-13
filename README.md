<div align="center">
<br />
<br />
<br />
  
<img src="./public/logo.svg" width="700"/>

<br />
<br />

[https://zod-playground.vercel.app/](https://zod-playground.vercel.app/)

<br />
<br />
<br />

</div>

# Zod Playground

Zod Playground is a web app that allows users to interact with the Zod library API.
Users can define schemas and test the validation of given values.
The app is designed to be user-friendly and easy to use.
It is a great tool for developers who are working with the Zod API and want to test their code on the fly without having to set up Zod locally.

## Use cases

- **Learn by doing**: Zod Playground shows you the validation result in the panel on the right.
- **Test different Zod versions**: Switch between different versions of Zod using the version picker.
- **Share schemas and values**: Share your schema and values with other developers by clicking the Share button and sending the URL.
- **Debug complex schemas**: Add multiple values to debug complex schema validation results.
- **Schema development**: Any other activity related to building and updating Zod schemas.

## Features

- **Real-time validation**
- **Version switch**
- **Shareable links**
- **User-friendly interface**
- **Validation result panels**
- **User-friendly validation errors**
- **Dark/light mode**

## Contribute

If you would like to contribute to Zod Playground, please fork the repository and submit a pull request. We welcome contributions of all kinds, including bug fixes, new features, and documentation improvements.

### Run locally

To get started with Zod Playground, you will need to have Node.js and npm installed on your machine. Once you have these installed, you can clone the repository and run the following commands:

```sh
npm install
npm run dev
```
This will start the development server and open the app in your default browser.

### Test

Zod playground uses playwright to run E2E tests. Execute the following commands to run tests locally.

```sh
npm test:init
npm test
```

This will start the development server and open the app in your default browser.

## License

This project is licensed under the MIT License.
