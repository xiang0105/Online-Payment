import React, { useEffect } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface WaveProps {
  heightPercent: number; // 水位高度 (0-100)
  color?: string; // 基礎波浪顏色
}

export default function Wave({ heightPercent, color = "#4285F4" }: WaveProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 波浪水平移動進度
  const progress = useSharedValue(0);
  // 水位高度進度 (加入動畫化，讓高度變化更平滑)
  const animatedHeight = useSharedValue(heightPercent);

  useEffect(() => {
    // 高度變化動畫
    animatedHeight.value = withTiming(heightPercent, { duration: 1000 });

    // 波浪循環動畫
    progress.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, [heightPercent]);

  // 優化後的繪製邏輯
  const createWavePath = (
    val: number,
    offset: number,
    amplitude: number,
    h: number
  ) => {
    "worklet";
    const baseHeight = 100 - h;
    const shift = ((val + offset) % 1) * 100;
    const startX = -100 + shift;

    // 使用優化的路徑指令：確保循環時的首尾完美連接
    return `
      M ${startX} ${baseHeight}
      Q ${startX + 25} ${baseHeight - amplitude} ${startX + 50} ${baseHeight}
      T ${startX + 100} ${baseHeight}
      T ${startX + 150} ${baseHeight}
      T ${startX + 200} ${baseHeight}
      T ${startX + 250} ${baseHeight}
      T ${startX + 300} ${baseHeight}
      V 110 H -100 Z
    `;
  };

  // 前層波浪 Props (主要顏色)
  const frontWaveProps = useAnimatedProps(() => ({
    d: createWavePath(progress.value, 0.0, 6, animatedHeight.value),
  }));

  // 後層波浪 Props (較淡顏色，相位錯開 0.5)
  const backWaveProps = useAnimatedProps(() => ({
    d: createWavePath(progress.value, 0.5, 4, animatedHeight.value),
  }));

  // 根據暗色模式動態調整透明度
  const backOpacity = isDark ? 0.25 : 0.4;
  const frontOpacity = isDark ? 0.8 : 1.0;

  return (
    <View style={styles.container}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        pointerEvents="none" // 避免攔截點擊事件
      >
        <AnimatedPath
          animatedProps={backWaveProps}
          fill={color}
          fillOpacity={backOpacity}
        />
        <AnimatedPath
          animatedProps={frontWaveProps}
          fill={color}
          fillOpacity={frontOpacity}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
});
