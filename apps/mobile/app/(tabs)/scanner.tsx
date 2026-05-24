import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Camera, CameraView } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [foundProduct, setFoundProduct] = useState<any>(null)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  const lookup = useMutation({
    mutationFn: (barcode: string) => api.get(`/foods/barcode/${barcode}`).then((r) => r.data),
    onSuccess: (data) => {
      if (data.food) {
        setFoundProduct(data.food)
      } else {
        Alert.alert('Not Found', 'Product not in database. Add it manually?', [
          { text: 'Cancel', onPress: () => setScanned(false) },
          { text: 'Add Manually', onPress: () => setScanned(false) },
        ])
      }
    },
    onError: () => {
      Alert.alert('Lookup Failed', 'Could not find product. Try again.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ])
    },
  })

  const logMeal = useMutation({
    mutationFn: ({ foodId, mealType }: { foodId: string; mealType: string }) =>
      api.post('/meals', { foodId, grams: 100, mealType }),
    onSuccess: () => {
      Alert.alert('Added!', 'Food logged to your diary.', [
        { text: 'Scan Another', onPress: () => { setFoundProduct(null); setScanned(false) } },
      ])
    },
  })

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned && data) {
      setScanned(true)
      lookup.mutate(data)
    }
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.message}>Camera access required for scanning</Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={() => Camera.requestCameraPermissionsAsync()}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (foundProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.productContainer}>
          <View style={styles.productHeader}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.productTitle}>Product Found!</Text>
          </View>

          <View style={styles.productCard}>
            <Text style={styles.productName}>{foundProduct.name}</Text>
            {foundProduct.brand && (
              <Text style={styles.productBrand}>{foundProduct.brand}</Text>
            )}

            <View style={styles.nutritionGrid}>
              {[
                { label: 'Calories', value: `${foundProduct.calories}`, color: Colors.accent, unit: 'kcal' },
                { label: 'Protein', value: `${foundProduct.protein}`, color: Colors.protein, unit: 'g' },
                { label: 'Carbs', value: `${foundProduct.carbs}`, color: Colors.carbs, unit: 'g' },
                { label: 'Fats', value: `${foundProduct.fats}`, color: Colors.fats, unit: 'g' },
              ].map((n) => (
                <View key={n.label} style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: n.color }]}>{n.value}</Text>
                  <Text style={styles.nutritionUnit}>{n.unit}</Text>
                  <Text style={styles.nutritionLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.perServing}>per 100g</Text>
          </View>

          <Text style={styles.logLabel}>Log to:</Text>
          <View style={styles.mealButtons}>
            {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((mealType) => (
              <TouchableOpacity
                key={mealType}
                style={styles.mealBtn}
                onPress={() => logMeal.mutate({ foodId: foundProduct.id, mealType })}
                disabled={logMeal.isPending}
              >
                <Text style={styles.mealBtnText}>{mealType}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => { setFoundProduct(null); setScanned(false) }}
          >
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { padding: 0 }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'upc_a', 'upc_e', 'code128', 'qr'] }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              {['tl', 'tr', 'bl', 'br'].map((pos) => (
                <View
                  key={pos}
                  style={[
                    styles.corner,
                    pos.startsWith('t') ? { top: -2 } : { bottom: -2 },
                    pos.endsWith('l') ? { left: -2 } : { right: -2 },
                    pos === 'tl' && { borderTopWidth: 3, borderLeftWidth: 3 },
                    pos === 'tr' && { borderTopWidth: 3, borderRightWidth: 3 },
                    pos === 'bl' && { borderBottomWidth: 3, borderLeftWidth: 3 },
                    pos === 'br' && { borderBottomWidth: 3, borderRightWidth: 3 },
                  ]}
                />
              ))}
              {lookup.isPending ? (
                <ActivityIndicator color={Colors.accent} size="large" />
              ) : (
                <Text style={styles.scanInstruction}>
                  {scanned ? 'Looking up product...' : 'Align barcode within frame'}
                </Text>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => setTorchOn(!torchOn)}
              >
                <Ionicons
                  name={torchOn ? 'flash' : 'flash-outline'}
                  size={24}
                  color={torchOn ? Colors.warning : Colors.text}
                />
              </TouchableOpacity>
              {scanned && (
                <TouchableOpacity
                  style={[styles.controlBtn, styles.rescanBtn]}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanText}>Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
  permissionBtn: { marginTop: Spacing.lg, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.lg },
  permissionBtnText: { color: Colors.text, fontWeight: '700' },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: 220 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: 250, height: 220, borderWidth: 1, borderColor: 'rgba(124, 77, 255, 0.3)', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.accent },
  scanInstruction: { color: Colors.text, fontSize: 13, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: Spacing.xl },
  controls: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  controlBtn: { padding: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.full },
  rescanBtn: { paddingHorizontal: 20, backgroundColor: Colors.accent },
  rescanText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
  productContainer: { flex: 1, padding: Spacing.md },
  productHeader: { alignItems: 'center', paddingVertical: Spacing.lg },
  productTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: Spacing.sm },
  productCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  productName: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  productBrand: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md },
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { fontSize: 20, fontWeight: '800' },
  nutritionUnit: { fontSize: 11, color: Colors.textSecondary },
  nutritionLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  perServing: { textAlign: 'center', fontSize: 11, color: Colors.textMuted },
  logLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  mealButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  mealBtn: { flex: 1, minWidth: '45%', paddingVertical: 12, backgroundColor: Colors.accent, borderRadius: BorderRadius.lg, alignItems: 'center' },
  mealBtnText: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  scanAgainBtn: { paddingVertical: 14, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', marginBottom: Spacing.xl },
  scanAgainText: { color: Colors.textSecondary, fontWeight: '600' },
})
