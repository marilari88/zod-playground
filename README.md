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

- Real-time validation
- Version switch
- Shareable links
- User-friendly interface
- User-friendly validation errors
- Validation result panels
- Dark/light mode

## Contribute

If you would like to contribute to Zod Playground, fork the repository and submit a pull request.
If you notice a bug or want to request a feature, feel free to open an issue.
Any kind of contribution is welcome.

### Run locally

To get started with Zod Playground development, you will need to have node.js and npm installed.

```sh
git clone https://github.com/marilari88/zod-playground.git
cd zod-playground

npm i       # Install dependencies
npm run dev # Start the development server
```

### Test

Zod playground uses Playwright to run E2E tests.
To run tests locally, execute the following commands:

```sh
npm test:install
npm test
```

## License

This project is licensed under the MIT License.
