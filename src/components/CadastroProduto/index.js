import React, { useState, useEffect } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import Relatorios from "../Relatorios/index"; // ajuste o caminho se necessário

const Tab = createBottomTabNavigator();

const API_URL = "http://192.168.112.1:3000/api/produtos";

const getTodayDate = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function Cadastro() {
  const [nomeProduto, setNomeProduto] = useState(null);
  const [unidade, setUnidade] = useState("kg");
  const [quantidadePorUnidade, setQuantidadePorUnidade] = useState("");
  const [quantidadeDePacotes, setQuantidadeDePacotes] = useState("1");
  const [validade, setValidade] = useState("");
  const [dataReceb, setDataReceb] = useState("");

  const navigation = useNavigation();

  useEffect(() => {
    setDataReceb(getTodayDate());
  }, []);

  const handleChangeValidade = (text) => {
    let digits = text.replace(/\D/g, "");
    if (digits.length > 2) {
      digits = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    setValidade(digits.slice(0, 7));
  };

  const handleConfirm = async () => {
    if (!nomeProduto || !quantidadePorUnidade || !quantidadeDePacotes || !validade) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios!");
      return;
    }

    let dataValidadeFormatada;
    if (validade && validade.includes("/")) {
      const [mes, ano] = validade.split("/");
      if (mes && ano && mes.length === 2 && ano.length === 4) {
        dataValidadeFormatada = `${ano}-${mes.padStart(2, '0')}-28`;
      } else {
        Alert.alert("Erro", "Formato de validade inválido (use MM/AAAA)");
        return;
      }
    }

    const qtdUnidade = parseFloat(quantidadePorUnidade);
    const qtdPacotes = parseInt(quantidadeDePacotes);

    if (isNaN(qtdUnidade) || isNaN(qtdPacotes) || qtdUnidade <= 0 || qtdPacotes <= 0) {
      Alert.alert("Erro", "Quantidades devem ser números positivos");
      return;
    }

    const dados = {
      nome: nomeProduto.trim(),
      unidade: unidade || "kg",
      quantidade_por_unidade: qtdUnidade,
      quantidade_de_pacotes: qtdPacotes,
      validade: dataValidadeFormatada,
      data_recebimento: new Date().toISOString().split("T")[0],
      descricao: nomeProduto.trim(),
      peso: qtdUnidade,
      quantidade: qtdPacotes,
      // codBar NÃO é enviado → o backend gera automaticamente
      dataDeEntrada: new Date().toISOString().split("T")[0],
      dataDeValidade: dataValidadeFormatada,
      dataLimiteDeSaida: null,
      codUsu: 1,
      codOri: 1,
      codList: 1
    };

    try {
      console.log("Enviando para o backend:", JSON.stringify(dados, null, 2));

      const response = await axios.post(API_URL, dados, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Resposta completa do backend:", {
        status: response.status,
        data: response.data
      });

      Alert.alert(
        "Sucesso",
        `Produto cadastrado!\nID: ${response.data.codProd || "novo"}\nCódigo de barras: ${response.data.codBar || "gerado automaticamente"}`
      );

      const id = response.data.codProd || response.data.id || "temp-" + Date.now();

      navigation.navigate("Relatórios", {
        novoItem: { ...dados, id, codBar: response.data.codBar }
      });

      // Limpar formulário
      setNomeProduto(null);
      setUnidade("kg");
      setQuantidadePorUnidade("");
      setQuantidadeDePacotes("1");
      setValidade("");
      setDataReceb(getTodayDate());
    } catch (error) {
      console.error("AXIOS ERROR:", error.message);
      console.error("STATUS:", error.response?.status);
      console.error("RESPOSTA DO BACKEND:", JSON.stringify(error.response?.data, null, 2));

      let mensagemErro = "Falha ao cadastrar. Veja o console.";

      if (error.response) {
        mensagemErro = `Erro ${error.response.status}: ${error.response.data?.error || error.response.data?.message || "Verifique o backend"}`;
      } else if (error.request) {
        mensagemErro = "Não foi possível conectar ao servidor.\nVerifique se o backend está rodando.";
      } else {
        mensagemErro = "Erro: " + error.message;
      }

      Alert.alert("Erro no cadastro", mensagemErro);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.centralizaitem}>
          <View style={styles.Pickerborder}>
            <Picker
              selectedValue={nomeProduto}
              onValueChange={setNomeProduto}
              mode="dropdown"
            >
              <Picker.Item label="Nome do Produto" value={null} />
              <Picker.Item label="Arroz" value="Arroz" />
              <Picker.Item label="Feijão" value="Feijão" />
              <Picker.Item label="Macarrão" value="Macarrão" />
              <Picker.Item label="Açúcar" value="Açúcar" />
              <Picker.Item label="Café" value="Café" />
            </Picker>
          </View>

          <View style={styles.rowInputs}>
            <TextInput
              placeholder="Peso"
              style={styles.input}
              keyboardType="numeric"
              value={quantidadePorUnidade}
              onChangeText={(t) => setQuantidadePorUnidade(t.replace(/[^0-9.]/g, ""))}
            />

            <View style={styles.inputPicker}>
              <Picker selectedValue={unidade} onValueChange={setUnidade}>
                <Picker.Item label="g" value="g" />
                <Picker.Item label="kg" value="kg" />
                <Picker.Item label="ml" value="ml" />
                <Picker.Item label="L" value="L" />
              </Picker>
            </View>

            <TextInput
              placeholder="Nº de pacotes"
              style={styles.input}
              keyboardType="numeric"
              value={quantidadeDePacotes}
              onChangeText={(t) => setQuantidadeDePacotes(t.replace(/\D/g, ""))}
            />
          </View>

          <TextInput
            placeholder="Validade (MM/AAAA)"
            style={styles.inputFull}
            maxLength={7}
            keyboardType="numeric"
            value={validade}
            onChangeText={handleChangeValidade}
          />

          <TextInput
            style={styles.dtreceb}
            value={dataReceb}
            editable={false}
          />

          <TouchableOpacity style={styles.btnconfirm} onPress={handleConfirm}>
            <Text style={styles.txtbtnconfirm}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ... (o resto do arquivo com AppTabs e styles continua igual)
export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 80,
          paddingTop: 10,
        },
      }}
    >
      <Tab.Screen
        name="Cadastro"
        component={Cadastro}
        options={{
          tabBarIcon: () => <Icon source="hospital-box" size={30} color="#215727" />,
        }}
      />
      <Tab.Screen
        name="Relatórios"
        component={Relatorios}
        options={{
          tabBarIcon: () => <Icon source="text-box" size={30} color="#215727" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, top: 55 },
  centralizaitem: { alignItems: "center", padding: 15, gap: 15 },
  Pickerborder: {
    borderWidth: 2,
    borderColor: "#215727",
    borderRadius: 8,
    width: 340,
    overflow: "hidden",
  },
  rowInputs: { flexDirection: "row", flexWrap: "wrap", gap: 20, paddingLeft: 40 },
  input: { borderWidth: 2, borderColor: "#215727", width: 150, borderRadius: 8, padding: 8 },
  inputFull: { borderWidth: 2, borderColor: "#215727", width: 340, borderRadius: 8, padding: 8 },
  inputPicker: {
    borderWidth: 2,
    borderColor: "#215727",
    width: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  dtreceb: { borderWidth: 2, borderColor: "#215727", width: 340, height: 50, borderRadius: 8, padding: 10 },
  btnconfirm: {
    width: 340,
    height: 50,
    backgroundColor: "#215727",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  txtbtnconfirm: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});