import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Table, Row } from "react-native-table-component";
import { useFocusEffect } from "@react-navigation/native"; // só isso fica
import Orientation from "react-native-orientation-locker";

const API_URL = "http://192.168.0.101:3000/api/cestas";

export default function RelatoriosCestas() {
  const [tableData, setTableData] = useState([]);

  const carregarCestas = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Falha ao carregar cestas');

      const json = await response.json();
      const cestas = json.cestas || [];

      const linhas = cestas.map(c => [
        c.produtos.map(p => `${p.descricao} (${p.quantidade})`).join(', '),
        c.descricao || 'Sem descrição',
        c.dataDeSaida,
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => Alert.alert('Editar cesta', 'Funcionalidade em desenvolvimento')}>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExcluir(c.codCes)}>
            <Text style={styles.actionTextDelete}>Excluir</Text>
          </TouchableOpacity>
        </View>,
      ]);

      setTableData(linhas);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível carregar as cestas");
    }
  };

  const handleExcluir = (codCes) => {
    Alert.alert(
      "Excluir Cesta",
      "Tem certeza que deseja excluir esta cesta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/${codCes}`, { method: 'DELETE' });
              if (!response.ok) throw new Error('Falha ao excluir');
              Alert.alert("Sucesso", "Cesta excluída!");
              carregarCestas();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível excluir");
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToPortrait();
      carregarCestas();

      return () => Orientation.unlockAllOrientations();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
        <Row
          data={["Produtos", "Descrição", "Data de Saída", "Ações"]}
          widthArr={[200, 150, 120, 120]}
          style={styles.head}
          textStyle={styles.textHead}
        />
      </Table>

      <ScrollView style={{ flex: 1 }}>
        <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
          {tableData.map((row, index) => (
            <Row
              key={index}
              data={row}
              widthArr={[200, 150, 120, 120]}
              style={styles.row}
              textStyle={styles.text}
            />
          ))}
        </Table>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  head: { height: 40, backgroundColor: '#e0ffe0' },
  textHead: { textAlign: 'center', fontWeight: 'bold' },
  row: { height: 50 },
  text: { textAlign: 'center', padding: 6 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  actionText: { color: '#007bff', fontWeight: 'bold' },
  actionTextDelete: { color: '#dc3545', fontWeight: 'bold' },
});