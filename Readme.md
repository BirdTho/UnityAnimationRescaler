# Unity Animation Resizer

This program non-destructively makes resized copies of your unim animations in a specified directory.
### Setup
1. Have `node` > 14 and `npm`

2. Clone this repo

3. Run `npm install`

### Running

1. Edit `scaler.js` and fine the two variables: `directoryOfAnims` and `scalar`

   * `directoryOfAnims` needs each `\` character escaped by doubling it. So all `\` becomes `\\`. See the comment in the file for more info.
   * If the `scalar` is `1.0` it will not rescale. For most cases your scalar will be likely between `0.001` and `1000.0`

2. Run...
`node scaler.js`
-- or --
`npm start`

3. Look for output in the targetted directory.