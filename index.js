import React from "react"
import PropTypes from "prop-types"
import ReactNative, {
  Keyboard,
  Platform,
  UIManager,
  TextInput,
} from "react-native"

// ----------------------------------------------------------------------------

const DEFAULT_ADDITIONAL_SCROLL = 20
const IS_IOS = Platform.OS === "ios"
const IS_ANDROID = Platform.OS === "android"

export const ANDROID_SOFT_INPUT_MODES = {
  adjustResize: "adjustResize",
  adjustPan: "adjustPan",
  adjustNothing: "adjustNothing",
}

// ----------------------------------------------------------------------------

export class ScrollViewKeyboardManager extends React.Component {
  static propTypes = {
    render: PropTypes.func.isRequired,
    androidSoftInputMode: PropTypes.string,
    additionalScrollOffset: PropTypes.number,
  }

  static defaultProps = {
    additionalScrollOffset: DEFAULT_ADDITIONAL_SCROLL,
    androidSoftInputMode: ANDROID_SOFT_INPUT_MODES.adjustResize,
  }

  // -------------------------------------

  state = {
    keyboardHeight: 0,
  }

  // -------------------------------------

  componentDidMount() {
    const showEvent = IS_IOS ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvent = IS_IOS ? "keyboardWillHide" : "keyboardDidHide"

    this.showListener = Keyboard.addListener(showEvent, this.onKeyboardShow)
    this.hideListener = Keyboard.addListener(hideEvent, this.onKeyboardHide)
  }

  componentWillUnmount() {
    this.showListener && this.showListener.remove()
    this.hideListener && this.hideListener.remove()
    this.showListener = null
    this.hideListener = null
  }

  // - Listerners ------------------------

  onKeyboardShow = frames => {
    const keyboardHeight = frames.endCoordinates.height
    const keyboardTopY = frames.endCoordinates.screenY
    const focusedField = TextInput.State.currentlyFocusedField()
    const responder = this.ref && this.ref.getScrollResponder()
    const scrollViewNode = responder && responder.getInnerViewNode()

    this.setState({ keyboardHeight })

    if (!focusedField || !scrollViewNode) {
      return
    }

    UIManager.viewIsDescendantOf(focusedField, scrollViewNode, isDescendant => {
      if (isDescendant) {
        this.adjustScrollToField(focusedField, keyboardHeight, keyboardTopY)
      }
    })
  }

  /**
   * On iOS the change of the bottom inset does not adjust the scrollview.
   * Therefore the scrollview could remain over scrolled, and it is necessary
   * to use the scroll to bottom. The animations (tested on iOS 11) of the
   * scorllview scrolling to bottom and of the keyboard disappearing combine
   * nicely.
   *
   * On Android the sudden change of the bottom margin is combined with the
   * animation of the keyboard (fade and slide to bottom) and the effect is
   * pleasant enough.
   */
  onKeyboardHide = () => {
    this.setState({ keyboardHeight: 0 }, () => {
      if (IS_IOS) {
        const { layoutMeasurement, contentOffset, contentSize } = this
        if (!(layoutMeasurement && contentOffset && contentSize)) {
          return
        }

        const scrollBottomY = layoutMeasurement.height + contentOffset.y
        const scrollMaxY = contentSize.height

        const shouldScrollToEnd = scrollBottomY > scrollMaxY
        if (shouldScrollToEnd) {
          this.ref.scrollToEnd({ animated: true })
        }
      }
    })
  }

  // - Scrolling logic -------------------

  adjustScrollToField = (field, keyboardHeight, keyboardTopY) => {
    UIManager.measureInWindow(field, (x, y, width, height) => {
      const fieldBottomY = y + height
      if (IS_IOS) {
        this.adjustScrollIos(field, fieldBottomY, keyboardTopY)
      }

      if (IS_ANDROID) {
        this.adjustScrollAndroid(fieldBottomY, keyboardTopY, keyboardHeight)
      }
    })
  }

  /**
   * `scrollResponderScrollNativeHandleToKeyboard` invokes
   * `scrollResponderInputMeasureAndScrollToKeyboard` which assumes that the
   * scroll view takes up the entire screen.
   *
   * https://github.com/facebook/react-native/blob/52f350a9cbe914f7fbdbb008a4cb40cb25b4a638/Libraries/Components/ScrollResponder.js#L520-L522
   *
   * Therefore it is necessary to compensate for the scrollview top top
   * offset.
   */
  adjustScrollIos = (field, fieldBottomY, keyboardTopY) => {
    const { additionalScrollOffset } = this.props
    const fieldNode = ReactNative.findNodeHandle(field)
    const scrollViewNode = ReactNative.findNodeHandle(this.ref)
    const responder = this.ref && this.ref.getScrollResponder()
    const adjustedFieldBottomY = fieldBottomY + additionalScrollOffset
    const shouldScrollUp = adjustedFieldBottomY > keyboardTopY

    if (!scrollViewNode) {
      return
    }
    if (!responder) {
      return
    }

    if (shouldScrollUp) {
      UIManager.measureInWindow(scrollViewNode, (_, scrollViewTopOffset) => {
        const additionalOffset = additionalScrollOffset + scrollViewTopOffset
        const preventNegativeScrolling = true
        responder.scrollResponderScrollNativeHandleToKeyboard(
          fieldNode,
          additionalOffset,
          preventNegativeScrolling
        )
      })
    }
  }

  /*
  * Android scrolls just enought to reveal the input.
  */
  adjustScrollAndroid = (fieldBottomY, keyboardTopY, keyboardHeight) => {
    // TODO: implement
    // const { layoutMeasurement, contentOffset, contentSize } = this
    // console.log({ contentOffset: contentOffset && contentOffset.y })
    //
    // if (!layoutMeasurement) {
    //   return
    // }
    //
    // console.log({ layoutMeasurementHeight: layoutMeasurement.height })
    // const scrollViewNode = ReactNative.findNodeHandle(this.ref)
    // UIManager.measureInWindow(scrollViewNode, (_, scrollViewTopOffset) => {
    //   const { additionalScrollOffset } = this.props
    //   const y =
    //     fieldBottomY +
    //     additionalScrollOffset -
    //     scrollViewTopOffset -
    //     layoutMeasurement.height
    //   console.log({ fieldBottomY })
    //   console.log({ scrollViewTopOffset })
    //   console.log({ y })
    //   if (y > 0) {
    //     this.ref.scrollTo({ y })
    //   }
    // })
  }

  // -------------------------------------

  storeRef = ref => {
    this.ref = ref
  }

  onScroll = event => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent

    this.layoutMeasurement = layoutMeasurement
    this.contentOffset = contentOffset
    this.contentSize = contentSize
  }

  // -------------------------------------

  render() {
    const { render, androidSoftInputMode } = this.props
    const { keyboardHeight } = this.state

    let androidStyle
    if (IS_ANDROID) {
      const shouldAjustMargin =
        androidSoftInputMode === ANDROID_SOFT_INPUT_MODES.adjustNothing ||
        androidSoftInputMode === ANDROID_SOFT_INPUT_MODES.adjustPan
      if (shouldAjustMargin) {
        androidStyle = { marginBottom: keyboardHeight }
      }
    }

    return render({
      ref: this.storeRef,
      scrollViewStyle: androidStyle,
      onScroll: this.onScroll,
      automaticallyAdjustContentInsets: false,
      contentInset: { bottom: keyboardHeight },
      scrollEventThrottle: 100,
    })
  }
}

// ----------------------------------------------------------------------------

export default ScrollViewKeyboardManager
