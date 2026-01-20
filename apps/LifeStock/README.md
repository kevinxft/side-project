# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## 已知问题与解决方案

### Native Bottom Tabs 图标格式错误

**错误信息**：
```
[RNScreens] Incorrect icon format. You must provide sfSymbolName, imageSource or templateSource.
```

**问题根因**：

使用 `@react-navigation/bottom-tabs` 的实验性 Native Bottom Tabs 功能时，存在版本兼容性问题：

1. **`@react-navigation/bottom-tabs@7.x`** 输出的图标格式：
   ```js
   { ios: { type: 'sfSymbol', name: 'xxx' }, android: ..., shared: ... }
   ```

2. **`react-native-screens@4.16`** 期望的图标格式：
   ```js
   { sfSymbolName: 'xxx' }  // 或 imageSource / templateSource
   ```

两者格式不匹配导致崩溃。`expo-router` 内部有版本检测逻辑（见 `NativeTabsView.js`），会根据 `react-native-screens` 版本选择不同的图标转换函数：
- 4.16 版本使用 `convertOptionsIconToPropsIcon_4_16`
- 4.18+ 版本使用 `convertOptionsIconToPropsIcon_4_18`

但 `@react-navigation/bottom-tabs` 直接传递给 `react-native-screens` 的格式只兼容 4.18+。

**解决方案**：

升级 `react-native-screens` 到 4.18 或更高版本：

```bash
npm install react-native-screens@~4.18.0
npx expo run:ios  # 重新构建原生应用
```

**正确的 tabBarIcon 配置**：

```tsx
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";

<Tabs.Screen
  name="(home)"
  options={{
    title: "库存",
    tabBarIcon: { type: "sfSymbol", name: "archivebox.fill" },
  }}
/>

// 或使用系统内置项（推荐用于 search）
<Tabs.Screen
  name="(search)"
  options={{
    tabBarSystemItem: "search",
  }}
/>
```

