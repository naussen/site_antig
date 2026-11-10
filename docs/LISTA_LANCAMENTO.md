# Lista de interesse no lançamento

## Ativação

1. Confira o histórico do Supabase compartilhado e aplique a migration `052_create_launch_interests.sql` antes do deploy. A tabela exige acesso administrativo e o cadastro usa a credencial server-side já existente.
2. No preview da Netlify, confira no log de pós-processamento o limite de 10 tentativas por minuto por IP e domínio para `/resumos/api/launch-interest`.
3. Abra a landing em janela anônima, cadastre um endereço de teste sob seu controle e confira a linha na tabela `public.launch_interests`. Repita com o mesmo e-mail e verifique que a data e a versão do primeiro aceite foram preservadas. Remova o endereço de teste antes de exportar a lista.

## Consentimento

A versão `lancamento-v1` usa este aceite.

> Autorizo o PRO Concursos a usar meu e-mail exclusivamente para me enviar informações sobre o lançamento da plataforma.

O texto integral da versão está em `/resumos/privacidade#lista-lancamento`. Ao alterar o termo, preserve a versão anterior no histórico do repositório e publique um novo identificador. A tabela registra o endereço, a versão do aceite e o horário do banco. O cadastro indica a manifestação apresentada no formulário. A titularidade da caixa postal deve ser tratada como pendente de confirmação quando houver dúvida.

## Exportação e envio

Use uma conta autorizada no SQL Editor do Supabase. Confira primeiro os pedidos de revogação recebidos pelo canal LGPD e pelo e-mail publicado no termo.

```sql
SELECT email
FROM public.launch_interests
ORDER BY email;
```

Exporte o resultado em CSV imediatamente antes do aviso. Importe o CSV diretamente como texto na ferramenta de disparo autorizada para o lançamento, mantenha os destinatários separados e inclua o canal de descadastro. Restrinja o acesso ao arquivo e apague-o após o uso. Envie apenas informações sobre o lançamento.

**Assunto sugerido** — O PRO Concursos está no ar

> O PRO Concursos foi lançado. A assinatura de lançamento custa R$ 19,90 por mês e reúne resumos, questões e legislação em um único ambiente.
>
> Acesse https://proconcursos.com.br/ para conhecer a plataforma.
>
> Você recebeu esta mensagem porque se cadastrou para receber informações sobre o lançamento. Para retirar seu consentimento, use o canal LGPD em https://proconcursos.com.br/resumos/contato#lgpd ou responda a este e-mail.

Use um remetente que aceite respostas e encaminhe as solicitações de retirada ao responsável pelo tratamento.

## Revogação e encerramento

- Ao receber um pedido, confirme o vínculo do solicitante com o endereço, remova a linha de `public.launch_interests` e retire o endereço de arquivos de campanha e envios pendentes. No painel, confira o e-mail antes de excluir a linha.
- Ao encerrar as comunicações do lançamento, desative o formulário e a rota de cadastro. Elimine os registros da lista e as cópias operacionais com acesso restrito, observadas as hipóteses legais de conservação.
