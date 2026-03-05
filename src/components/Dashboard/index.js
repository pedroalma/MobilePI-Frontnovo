import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  processColor,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-charts-wrapper';
import { useNavigation } from '@react-navigation/native';

export default function Dashboard() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [chartData, setChartData] = useState({
    doacoes: [],
    meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    maisDoados: [],
    cestasMontadas: 0,
    metaCestas: 100,
  });

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const url = 'http://192.168.0.101:3000/api/produtos';
        console.log('Buscando produtos em:', url);

        const response = await fetch(url);

        console.log('Status:', response.status);

        if (!response.ok) {
          throw new Error(`Erro do servidor: ${response.status}`);
        }

        const json = await response.json();
        console.log('Resposta completa:', json);

        const produtos = json.produtos || json || [];
        console.log('Produtos encontrados:', produtos.length);

        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        const doacoesMensais = Array(12).fill(0);
        const mapaProdutos = {};
        let totalUnidades = 0;

        produtos.forEach(produto => {
          // Ajustado para os campos reais do seu banco
          const qtdTotal = Number(produto.peso || 0) * Number(produto.quantidade || 1);
          totalUnidades += qtdTotal;

          const dataStr = produto.dataDeEntrada || produto.createdAt;
          if (dataStr) {
            const data = new Date(dataStr);
            if (!isNaN(data.getTime())) {
              const mes = data.getMonth();
              doacoesMensais[mes] += qtdTotal;
            }
          }

          const nome = produto.descricao || produto.nome || 'Sem nome';
          mapaProdutos[nome] = (mapaProdutos[nome] || 0) + qtdTotal;
        });

        const maisDoados = Object.entries(mapaProdutos)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        const cestasMontadas = Math.floor(totalUnidades / 20);

        const meses = nomesMeses.slice(0, 6);
        const doacoes = doacoesMensais.slice(0, 6).map(valor => ({ y: valor }));

        setChartData({
          doacoes,
          meses,
          maisDoados,
          cestasMontadas,
          metaCestas: 100,
        });

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error.message);
        setErro(error.message || 'Falha ao carregar dados');
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#14532d" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorText}>Erro</Text>
        <Text style={styles.errorDetail}>{erro}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setErro(null);
          }}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const semDados = chartData.maisDoados.length === 0;

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.screen}>
        {/* Logo */}
        <View style={styles.viewContImg}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Image source={require('../../assets/icons/logo1.png')} style={styles.img} />
          </TouchableOpacity>
        </View>

        {/* Gráfico de Barras */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Doações por mês</Text>
          <BarChart
            style={styles.barChart}
            data={{
              dataSets: [{
                label: 'Doações',
                values: chartData.doacoes.length > 0 ? chartData.doacoes : [{ y: 0 }],
                config: { color: processColor('#14532d') },
              }],
            }}
            xAxis={{
              valueFormatter: chartData.meses,
              granularityEnabled: true,
              granularity: 1,
              position: 'BOTTOM',
              textSize: 11,
              textColor: processColor('#fff'),
            }}
            yAxis={{ left: { enabled: false }, right: { enabled: true, textColor: processColor('#fff') } }}
            chartDescription={{ text: '' }}
            legend={{ enabled: false }}
            animation={{ durationX: 1200 }}
            touchEnabled={true}
          />
        </View>

        {/* PieChart */}
        <View style={styles.pieCard}>
          <Text style={styles.cardTitle}>Produtos mais doados</Text>
          <PieChart
            style={styles.pieChart}
            data={{
              dataSets: [{
                values: semDados ? [{ value: 1, label: 'Sem dados' }] : chartData.maisDoados,
                label: 'Produtos',
                config: {
                  colors: [
                    processColor('#f87171'),
                    processColor('#facc15'),
                    processColor('#60a5fa'),
                    processColor('#34d399'),
                    processColor('#a78bfa'),
                    processColor('#fb923c'),
                  ],
                  valueTextSize: semDados ? 14 : 11,
                  valueTextColor: processColor('#000'),
                  selectionShift: 13,
                },
              }],
            }}
            legend={{ enabled: false }}
            chartDescription={{ text: '' }}
            entryLabelColor={processColor('#000')}
            entryLabelTextSize={11}
          />
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: '#f87171' }]} />
            <View style={[styles.dot, { backgroundColor: '#facc15' }]} />
            <View style={[styles.dot, { backgroundColor: '#60a5fa' }]} />
            <View style={[styles.dot, { backgroundColor: '#34d399' }]} />
            <View style={[styles.dot, { backgroundColor: '#a78bfa' }]} />
            <View style={[styles.dot, { backgroundColor: '#fb923c' }]} />
          </View>
        </View>

        {/* Cards de cestas */}
        <View style={styles.largeCard}>
          <View style={styles.halfCardLeft}>
            <Text style={styles.label}>Cestas montadas</Text>
            <Text style={styles.bigNumber}>{chartData.cestasMontadas}</Text>
          </View>
          <View style={styles.halfCardRight}>
            <Text style={styles.label}>Meta de cestas</Text>
            <Text style={styles.bigNumber}>{chartData.metaCestas}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Cestas')}>
          <Text style={styles.buttonText}>Fazer a cesta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f9fafb' },
  screen: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#14532d' },
  errorText: { fontSize: 20, color: '#dc2626', fontWeight: 'bold' },
  errorDetail: { fontSize: 14, color: '#7f1d1d', marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 20, backgroundColor: '#14532d', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  viewContImg: { width: '90%', alignItems: 'center', marginVertical: 15 },
  img: { width: 220, height: 80, resizeMode: 'contain' },
  card: { width: '90%', backgroundColor: '#0d9488', borderRadius: 12, padding: 12, marginBottom: 20, elevation: 5 },
  pieCard: { width: '90%', backgroundColor: '#0d9488', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20, elevation: 5 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  barChart: { height: 260, width: '100%' },
  pieChart: { width: 220, height: 220 },
  dotRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, maxWidth: '80%' },
  dot: { width: 16, height: 16, borderRadius: 8, margin: 6 },
  largeCard: { width: '90%', flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginTop: 10, elevation: 5 },
  halfCardLeft: { flex: 1, backgroundColor: '#14532d', alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  halfCardRight: { flex: 1, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  label: { color: '#fff', fontSize: 15, marginBottom: 8, textTransform: 'uppercase' },
  bigNumber: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  button: { width: '90%', backgroundColor: '#14532d', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});