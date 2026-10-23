import { UserCheck } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

export default function ApprovalHeader() {
  return (
    <PageHeader
      icon={UserCheck}
      title="Aprovações"
      description="Gestão · solicitações de acesso aguardando liberação"
    />
  );
}
