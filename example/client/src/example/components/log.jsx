import React from 'react'
import {connect} from 'react-redux'

import Checkmark from 'grommet/components/icons/base/Checkmark'
import Close from 'grommet/components/icons/base/Close'
import More from 'grommet/components/icons/base/More'
import Table from 'grommet/components/Table'
import TableRow from 'grommet/components/TableRow'

import {exampleCalls} from '../selectors'

export function ExampleLog (props) {
  const {calls} = props

  const rows = calls.map(function (call, seq) {
    const status = call.get('status')
    let statusComponent

    if (status === 'pending') {
      statusComponent = <More colorIndex='unknown' />
    } else if (status === 'success') {
      statusComponent = <Checkmark colorIndex='ok' />
    } else {
      statusComponent = <Close colorIndex='critical' />
    }

    let renderedPayload

    if (call.has('payload')) {
      renderedPayload = JSON.stringify(call.get('payload'))
    }

    return <TableRow key={seq}>
      <td>{call.get('contextId')}</td>
      <td>{call.get('ns')}</td>
      <td>{call.get('command')}</td>
      <td>{statusComponent}</td>
      <td>{renderedPayload}</td>
    </TableRow>
  })

  return <Table>
    <thead>
      <tr>
        <th>Context</th>
        <th>Namespace</th>
        <th>Command</th>
        <th>Result</th>
        <th>Payload</th>
      </tr>
    </thead>

    <tbody>{rows}</tbody>
  </Table>
}

export default connect(
    function mapStateToProps (state) {
      return {
        calls: exampleCalls(state)
      }
    }
)(ExampleLog)
