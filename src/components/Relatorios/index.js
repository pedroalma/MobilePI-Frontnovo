import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { Table, Row } from "react-native-table-component";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import Orientation from "react-native-orientation-locker";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import FileViewer from "react-native-file-viewer";
import moment from "moment-timezone";
import axios from "axios";

export default function Relatorios() {
  const route = useRoute();
  const navigation = useNavigation();

  const [tableData, setTableData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState([]);

  const widthArr = [120, 100, 90, 110, 180, 110, 100, 140]; // Ajustado para melhor visualização

  const API_URL = "http://192.168.0.101:3000/api/produtos";

  const getTurno = () => {
    const agora = moment().tz("America/Sao_Paulo");
    const hora = agora.hours();
    if (hora >= 8 && hora < 12) return "Manhã";
    if (hora >= 12 && hora < 16) return "Tarde";
    if (hora >= 16 && hora < 19) return "Noite";
    return "Fora do horário";
  };

  const turnoAtual = getTurno();

  const formatarData = (data) => {
    if (!data) return "—";
    return moment(data).format("DD/MM/YYYY");
  };

  // Carrega produtos do backend
  const carregarProdutos = useCallback(async () => {
    try {
      console.log("Carregando produtos do backend...");
      const response = await axios.get(API_URL);
      const produtos = response.data.produtos || response.data || [];

      console.log("Produtos recebidos:", produtos.length);

      const linhas = produtos.map((item) => [
        item.nome || item.descricao || "—",
        `${item.peso || 0} ${item.unidade || "kg"}`,
        item.quantidade_de_pacotes || item.quantidade || 0,
        formatarData(item.dataDeValidade || item.validade),
        item.descricao || "—",
        formatarData(item.dataDeEntrada || item.data_recebimento),
        turnoAtual,
        item.codProd || item.id || "", // ID sempre na última posição
      ]);

      setTableData(linhas);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error.message);
      Alert.alert("Erro", "Não foi possível carregar os produtos do servidor.");
    }
  }, [turnoAtual]);

  useFocusEffect(
    useCallback(() => {
      Orientation.lockToLandscape();
      carregarProdutos();

      return () => Orientation.lockToPortrait();
    }, [carregarProdutos])
  );

  useEffect(() => {
    if (route.params?.novoItem) {
      console.log("Novo item recebido via params:", route.params.novoItem);
      carregarProdutos(); // Recarrega tudo para incluir o novo
      navigation.setParams({ novoItem: null });
    }
  }, [route.params?.novoItem, carregarProdutos, navigation]);

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditData([...tableData[index]]);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditData([]);
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    const id = tableData[editingIndex][7];
    if (!id) {
      Alert.alert("Erro", "ID do produto não encontrado na linha.");
      return;
    }

    console.log("Tentando atualizar produto ID:", id);
    console.log("URL do PUT:", `${API_URL}/${id}`);

    const edited = editData;

    const updatedData = {
      nome: edited[0] || "",
      quantidade_por_unidade: parseFloat(edited[1]?.split(" ")[0] || 0),
      unidade: edited[1]?.split(" ")[1] || "kg",
      quantidade_de_pacotes: Number(edited[2]) || 0,
      dataDeValidade: edited[3] ? moment(edited[3], "DD/MM/YYYY").format("YYYY-MM-DD") : null,
      descricao: edited[4] || "",
      dataDeEntrada: edited[5] ? moment(edited[5], "DD/MM/YYYY").format("YYYY-MM-DD") : null,
    };

    try {
      const response = await axios.put(`${API_URL}/${id}`, updatedData);
      console.log("PUT sucesso - Status:", response.status);

      await carregarProdutos(); // Recarrega a tabela com dados atualizados
      Alert.alert("Sucesso", "Produto atualizado com sucesso!");

      setEditingIndex(null);
      setEditData([]);
    } catch (error) {
      console.error("Erro completo no PUT:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: `${API_URL}/${id}`,
      });

      let msg = "Falha ao atualizar.";
      if (error.response?.status === 404) {
        msg = "Produto não encontrado (404). Verifique se o ID existe no banco.";
      } else if (error.response?.status === 500) {
        msg = "Erro interno no servidor.";
      }

      Alert.alert("Erro", `${msg}\nStatus: ${error.response?.status || "desconhecido"}`);
    }
  };

  const gerarPDF = async () => {
    if (tableData.length === 0) return Alert.alert("Erro", "Sem dados para PDF.");

    const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1>Relatório de Produtos - ${moment().format("DD/MM/YYYY HH:mm")}</h1>
          <p>Turno atual: ${turnoAtual}</p>
          <table border="1" style="width:100%; border-collapse:collapse; font-size:12px;">
            <tr style="background:#e0ffe0;">
              <th>Produto</th><th>Peso</th><th>Quantidade</th><th>Validade</th>
              <th>Descrição</th><th>Recebimento</th><th>Turno</th>
            </tr>
            ${tableData.map(row => `
              <tr>
                <td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td>
                <td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td>
              </tr>
            `).join("")}
          </table>
        </body>
      </html>
    `;

    try {
      const options = {
        html,
        fileName: `Relatorio_${moment().format("YYYYMMDD_HHmm")}`,
        directory: "Documents",
      };
      const file = await RNHTMLtoPDF.convert(options);
      await FileViewer.open(file.filePath);
    } catch (error) {
      Alert.alert("Erro ao gerar PDF", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal>
        <View>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
            <Row
              data={["Produto", "Peso", "Quantidade", "Validade", "Descrição", "Recebimento", "Turno", "Ações"]}
              widthArr={widthArr}
              style={styles.head}
              textStyle={styles.textHead}
            />
          </Table>

          <ScrollView style={{ maxHeight: 500 }}>
            <Table borderStyle={{ borderWidth: 1, borderColor: '#c8e1ff' }}>
              {tableData.map((row, index) => {
                const isEditing = editingIndex === index;
                return (
                  <Row
                    key={index}
                    widthArr={widthArr}
                    style={styles.row}
                    data={
                      isEditing
                        ? [
                            ...editData.slice(0, 6).map((cell, i) => (
                              <TextInput
                                key={i}
                                style={styles.input}
                                value={String(cell ?? "")}
                                onChangeText={(t) => {
                                  const newEdit = [...editData];
                                  newEdit[i] = t;
                                  setEditData(newEdit);
                                }}
                                keyboardType={i === 1 || i === 2 ? "numeric" : "default"}
                              />
                            )),
                            <Text style={styles.turnoText}>{editData[6]}</Text>,
                            <View style={styles.actions}>
                              <TouchableOpacity onPress={handleSaveEdit} style={styles.btnSave}>
                                <Text style={styles.btnText}>Salvar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={cancelEditing} style={styles.btnCancel}>
                                <Text style={styles.btnText}>Cancelar</Text>
                              </TouchableOpacity>
                            </View>,
                          ]
                        : [
                            ...row.slice(0, 7).map(cell => (
                              <Text key={cell} style={styles.cellText}>{cell}</Text>
                            )),
                            <View style={styles.actions}>
                              <TouchableOpacity onPress={() => startEditing(index)} style={styles.btnEdit}>
                                <Text style={styles.btnText}>Editar</Text>
                              </TouchableOpacity>
                              {/* Excluir removido conforme solicitado */}
                            </View>,
                          ]
                    }
                  />
                );
              })}
            </Table>
          </ScrollView>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.pdfButton} onPress={gerarPDF}>
        <Text style={styles.pdfText}>📄 Gerar PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  head: { height: 50, backgroundColor: "#e0ffe0" },
  textHead: { textAlign: "center", fontWeight: "bold", fontSize: 14 },
  row: { height: 50 },
  cellText: { textAlign: "center", fontSize: 13, padding: 6 },
  input: { borderWidth: 1, borderColor: "#007bff", padding: 4, fontSize: 13, textAlign: "center" },
  turnoText: { textAlign: "center", padding: 6, fontSize: 13 },
  actions: { flexDirection: "row", justifyContent: "center", gap: 10, padding: 4 },
  btnEdit: { backgroundColor: "#007bff", padding: 8, borderRadius: 4 },
  btnSave: { backgroundColor: "#28a745", padding: 10, borderRadius: 6 },
  btnCancel: { backgroundColor: "#6c757d", padding: 10, borderRadius: 6 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  pdfButton: { margin: 20, backgroundColor: "#215727", padding: 15, borderRadius: 10, alignItems: "center" },
  pdfText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});