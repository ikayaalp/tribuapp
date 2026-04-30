import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Derinlemesine Analiz',
    description: 'Dünyanın dört bir yanından binlerce maçı anlık verilerle inceleyin. Doğru istatistiklerle bahis stratejinizi güçlendirin.',
    image: require('../assets/images/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Yapay Zeka Tahminleri',
    description: 'Gelişmiş algoritmalarımız geçmiş verileri işleyerek size en yüksek kazanma olasılığına sahip maçları sunar.',
    image: require('../assets/images/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Akıllı Bahis Deneyimi',
    description: 'Şansa yer bırakmayın. Profesyonellerin tercihi olan BetAnaliz ile veriye dayalı kararlar alın ve kazanmaya başlayın.',
    image: require('../assets/images/onboarding3.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem('@onboarding_completed', 'true');
        router.replace('/auth');
      } catch (e) {
        console.error('Error saving onboarding state', e);
      }
    }
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#555', '#1DB954', '#555'],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor }]}
              key={i.toString()}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <Paginator />
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Başla' : 'Devam Et'}
          </Text>
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-forward'}
            size={20}
            color="#000"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: width,
    height: height * 0.60,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    marginBottom: 16,
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontWeight: '400',
    color: '#AAA',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 10,
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: '#1DB954',
    borderRadius: 100,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
