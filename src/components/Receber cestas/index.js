import React, { useState, useEffect } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import RelatoriosCestas from "./relatoriocestas"; // ajuste o caminho

const Tab = createBottomTabNavigator();

const API_URL = "http://192.168.0.101:3000/api/cestas";

function CadastroCestas() {
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [produtosAdicionados, setProdutosAdicionados] = useState([]); // array de objetos { codProd, descricao }
  const [descricao, setDescricao] = useState('');
  const [dataSaida, setDataSaida] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    setDataSaida(getTodayDate());
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleAdicionarProduto = () => {
    if (!produtoSelecionado) return;

    const novoProduto = {
      codProd: produtoSelecionado.codProd, // ajuste conforme sua lista real
      descricao: produtoSelecionado.descricao,
    };

    const novos = [...produtosAdicionados, novoProduto];
    setProdutosAdicionados(novos);
    setDescricao(novos.map(p => p.descricao).join('\n'));
    setProdutoSelecionado(null);
  };

  const handleConfirm = async () => {
    if (produtosAdicionados.length === 0 || !descricao || !dataSaida) {
      Alert.alert("Atenção", "Preencha todos os campos e adicione pelo menos um produto!");
      return;
    }

    const payload = {
      produtos: produtosAdicionados.map(p => ({
        codProd: p.codProd,
        quantidade: 1, // pode adicionar quantidade por item depois
      })),
      descricao,
      dataDeSaida: dataSaida.split('/').reverse().join('-'), // dd/mm/yyyy → yyyy-mm-dd
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao salvar cesta');
      }

      Alert.alert("Sucesso", "Cesta cadastrada com sucesso!");
      navigation.navigate("Relatórios Cestas");

      // Limpa formulário
      setProdutosAdicionados([]);
      setDescricao('');
      setDataSaida(getTodayDate());
    } catch (err) {
      Alert.alert("Erro", err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.centralizaitem}>
        <View style={styles.Pickerborder}>
          <Picker
            selectedValue={produtoSelecionado}
            onValueChange={(item) => setProdutoSelecionado(item)}
            mode="dropdown"
          >
            <Picker.Item label="Nome do Produto" value={null} />
            <Picker.Item label="Arroz" value={{ codProd: 1, descricao: "Arroz" }} />
            <Picker.Item label="Feijão" value={{ codProd: 2, descricao: "Feijão" }} />
            <Picker.Item label="Macarrão" value={{ codProd: 3, descricao: "Macarrão" }} />
            {/* Carregue produtos reais do backend aqui depois */}
          </Picker>
        </View>

        <TouchableOpacity style={styles.btnadicionar} onPress={handleAdicionarProduto}>
          <Text style={styles.txtbtnadicionar}>Adicionar Produto</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Descrição da cesta"
          style={styles.descricao}
          multiline={true}
          numberOfLines={4}
          value={descricao}
          onChangeText={setDescricao}
        />

        <TextInput
          placeholder="Data de Saída"
          style={styles.dtreceb}
          value={dataSaida}
          editable={false}
        />

        <TouchableOpacity style={styles.btnconfirm} onPress={handleConfirm}>
          <Text style={styles.txtbtnconfirm}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ... (resto do arquivo com AppTabs igual ao seu original)