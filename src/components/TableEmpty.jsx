export default function TableEmpty({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-empty">
        {text}
      </td>
    </tr>
  )
}
