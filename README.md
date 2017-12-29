# react-native-scroll-view-keyboard-manager

React Native component which prevents inputs from being hidden by the keyboard
in scroll views - iOS and Android.

Features:

* Uses a render prop (which is better than a higher order component).
* On iOS, set the bottom inset to accommodate the keyboard and scrolls to the component if needed.
* On iOS, the scroll to reveal an input is performed while the keyboard is appearing.
* On Android, changes behavior according to the soft input mode:
  * if set to `adjustResize` it only adjusts the scrolling for the additional offset (not done yet).
  * if set to `adjustPan` it sets a bottom margin on the scroll view with the same height of the keyboard (there are known issues).
* The scroll to reveal an input is performed only if the input would be hidden by the keyboard.
* The scoll is not restored to any prosition after the user dismisses the keyboard.
* On iOS, the case in which the user scrolled past the content view using the bottom inset is handled graciuscly.
* No unwanted bouncy animations.
* Simple interface, generic implementation.

## Known issues

* `additionalScrollOffset` is not implemented yet on Android.
* On Android, the `adjustPan` setting of the soft input mode causes the
  following glitches:
  * If an input would slightly be covered by the scroll view the screen can
    remain slightly panned (and any present top bar might remain slightly cropped).
  * If the focused input is located at the bottom of the scroll view the screen
    is temporarily panned and the completely restored (animation glitch which
    doesn't impact usability).

## Installation

```
npm install react-native-scroll-view-keyboard-manager
```

## Usage

```js
export class MyScrollView extends React.Component {
  import { ScrollView } from "react-native"
  import ScrollViewKeyboardManager, {
    ANDROID_SOFT_INPUT_MODES
  } from "react-native-scroll-view-keyboard-manager"


  render() {
    const { children } = this.props

    return (
      <ScrollViewKeyboardManager
        additionalScrollOffset={20}
        androidSoftInputMode={ANDROID_SOFT_INPUT_MODES.adjustResize}
        render={scrollViewProps => {
          return <ScrollView {...scrollViewProps}>{children}</ScrollView>
        }}
      />
    )
  }
}
```

## Props

| Name                   | Description                                  | Default          |
| ---------------------- | -------------------------------------------- | ---------------- |
| render                 | The function to render the scrollview        | required         |
| androidSoftInputMode   | The soft input mode used in Android          | `"adjustResize"` |
| additionalScrollOffset | The additional offset to add below the input | `20`             |

## Credits

Copyright (c) 2017 Discontinuity s.r.l.
Available under the MIT license.

This component is derived from [react-native-keyboard-aware-scroll-view](https://github.com/APSL/react-native-keyboard-aware-scroll-view#usage) by [APSL](https://github.com/apsl).
