import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from "react-native"
import Reanimated, { Extrapolate, interpolate, SharedValue, useAnimatedStyle, ExtrapolationType, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import GridLayoutProvider from './gridLayoutProvider';
interface CellProps {
    layoutProvider: GridLayoutProvider
    style: any,
    index: number,
    columnNumber: number,
    scale: Reanimated.SharedValue<number>
    pinching: Reanimated.SharedValue<boolean>
    lastScrollY: SharedValue<number> | undefined;
}

// eslint-disable-next-line react/display-name
const Cell: React.FC<CellProps> = React.forwardRef(({ layoutProvider, columnNumber, index, scale, style, ...props }, ref) => {
    const sharedFinalRangeValues = useSharedValue(null);
    const opacity = useRef<Animated.Value>(new Animated.Value(1)).current;
    const timerId = useRef(null);
    const animationStyle = useAnimatedStyle(() => {
        const extrapolation = {
            extrapolateLeft: Extrapolate.CLAMP,
            extrapolateRight: Extrapolate.CLAMP,
        };
        if (!sharedFinalRangeValues.value)
            return {}
        const finalRangeValues = sharedFinalRangeValues.value;
        const colsRange = finalRangeValues.colsRange;
        if (colsRange.length) {
            if (colsRange.length === 1) return {};

            const finalScale = interpolate(scale.value, colsRange, finalRangeValues.scale);
            const finalTranslateY = interpolate(
                scale.value,
                colsRange,
                finalRangeValues.translateY,
                extrapolation
            );

            return {
                transform: [{
                    translateX: interpolate(
                        scale.value,
                        colsRange,
                        finalRangeValues.translateX,
                        extrapolation
                    ),
                }, {
                    translateY: finalTranslateY
                }, {
                    scale: finalScale
                }]
            }
        }
        return {}
    }, [])
    opacity.setValue(0);
    useEffect(() => {
        clearTimeout(timerId.current)
        timerId.current = setTimeout(() => {
            timerId.current = null;
            sharedFinalRangeValues.value = layoutProvider.getLayoutManager()?.getLayoutTransitionRangeForIndex(index, columnNumber);
            opacity.setValue(1);
        }, 50);
    }, [index])
    return (
        <Reanimated.View  {...props} style={[style, animationStyle]}>
            <Animated.View style={[styles.internalContainer, { opacity: opacity }]}>
                {props.children}
            </Animated.View>
        </Reanimated.View >
    );
})
const areEqual = (prev: Props, next: Props) => {
    return (prev.index === next.index) || (prev?.pinching.value === true && next.pinching.value === true)
}
const styles = StyleSheet.create({
    internalContainer: {
        flex: 1
    }
});
export default memo(Cell, areEqual);