import { useEffect, useRef, useState } from "react";
import { FileDown, Ruler } from "lucide-react";
import { toast } from "sonner";
import type { MedicaoDetalhe } from "../../../types/medicao";
import { useMedicoes } from "../../store/medicoes";
import { downloadBlob } from "../../utils/download-file";
import { formatCurrency } from "../../utils/format-currency";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";
import { EmptyNote } from "../../components/EntityViewer/ViewFrame";
import { MedicaoLeitura } from "../Medicoes/MedicaoLeitura";
import { medicaoFilename, medicaoTitulo } from "./medicao-display";

interface MedicaoLeituraModalProps {
  medicaoId: string;
  numeroOs: string;
  onClose: () => void;
}

// Medição em leitura a partir do modal da OS, para quem não tem a tela Medições (login da empresa)
export function MedicaoLeituraModal({ medicaoId, numeroOs, onClose }: MedicaoLeituraModalProps) {
  const { fetchMedicao, fetchMedicaoDocument } = useMedicoes();
  const [detalhe, setDetalhe] = useState<MedicaoDetalhe | null>(null);
  const [baixando, setBaixando] = useState(false);
  // O pai passa uma função nova a cada render: a busca não pode depender dela
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    let ativo = true;
    fetchMedicao(medicaoId)
      .then((data) => ativo && setDetalhe(data))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar a medição");
        onCloseRef.current();
      });
    return () => {
      ativo = false;
    };
  }, [medicaoId, fetchMedicao]);

  async function baixarPdf() {
    if (!detalhe) return;
    setBaixando(true);
    try {
      downloadBlob(await fetchMedicaoDocument(detalhe.id), medicaoFilename(detalhe.numero, numeroOs));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar o PDF da medição");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <Modal open size="2xl" onClose={onClose}>
      <ModalHeader
        icon={Ruler}
        title={detalhe ? medicaoTitulo(detalhe.numero) : "Medição"}
        description={detalhe ? `${numeroOs} · ${formatCurrency(detalhe.totais.valorEsta)}` : numeroOs}
        onClose={onClose}
      />
      <ModalBody>{detalhe ? <MedicaoLeitura detalhe={detalhe} compact /> : <EmptyNote>Carregando medição...</EmptyNote>}</ModalBody>
      <ModalFooter>
        {detalhe && (
          <Button variant="secondary" icon={FileDown} loading={baixando} onClick={baixarPdf}>
            Baixar PDF
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
